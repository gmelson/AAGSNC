import 'dart:async';
import 'dart:html';
import 'dart:convert';
import 'package:angular/angular.dart';


class CardIdentifier{
  String cardId;
  String deviceProfileId;
  int issuerId;
  String sdProfileId;
  String seProfileId;
  String secDomainServId;
  String walletId;
  String registrationStatus;
  
  List <Map>appletInstances;
  List <Map>packageProfiles;
  List <String>restrictedAids;
  
  Map deviceProfile;
  Map seProfile;
  
  CardIdentifier(
      this.cardId, 
      this.deviceProfileId, 
      this.issuerId,
      this.sdProfileId,
      this.seProfileId,
      this.secDomainServId,
      this.walletId,
      this.registrationStatus);
  
}

@NgController(
    selector: '[perso-client]',
    publishAs: 'perso')
class PersoController {
  
  static const Duration RECONNECT_DELAY = const Duration(milliseconds: 500);
  bool isFirstTime = true;
  bool connectPending = false;
  WebSocket webSocket;
  List<CardIdentifier>mCardIdentifier;
  
  PersoController(){
    mCardIdentifier = new List<CardIdentifier>();
    connect();
  }
  
  void connect() {
    connectPending = false;
    webSocket = new WebSocket('ws://127.0.0.1:12345/perso');
    webSocket.onOpen.first.then((_) {
      onConnected();
      webSocket.onClose.first.then((_) {
        print("Connection disconnected to ${webSocket.url}");
        onDisconnected();
      });
    });
    webSocket.onError.first.then((_) {
      print("Failed to connect to ${webSocket.url}. "
            "Please run bin/server.dart and try again.");
      onDisconnected();
    });
  }

  void onConnected() {
    webSocket.onMessage.listen((e) {
      onMessage(e.data);
    });
    if(isFirstTime){
      startProcess();
      isFirstTime = false;
    }
  }
  
  void onDisconnected() {
    if (connectPending) return;
    connectPending = true;
    new Timer(RECONNECT_DELAY, connect);
  }

  /**
   * Get top level json object; determine if it is cardidentifier; if so
   * set description and id for this object.  Otherwise, iterate over the 
   * additional data and add to the name/value pairs to the flexie grid for 
   * display.
   */

  void onMessage(data) {
    
    var cardId;
    var package;
    
    //double decode hack
    var response = JSON.decode(JSON.decode(data));
    var cardperso = response['cardperso'];
    if(cardperso != null && cardperso[0] != null){
      try{
        
        for(var i=0; i< cardperso.length; i++){
          cardId = new CardIdentifier(
              cardperso[i]['seProfileId'],
              cardperso[i]['deviceProfileId'],
              cardperso[i]['issuerId'],
              cardperso[i]['sdProfileId'],
              cardperso[i]['seProfileId'],
              cardperso[i]['secDomainServId'],
              cardperso[i]['walletId'],
              cardperso[i]['registrationStatus']);
                    
          cardId.deviceProfile = JSON.decode(cardperso[i]['deviceProfile']);
          cardId.seProfile = JSON.decode(cardperso[i]['seProfile']);
          
          //setup List of json objects
          cardId.appletInstances = new List<Map>();
          cardId.packageProfiles = new List<Map>();
          cardId.restrictedAids = new List<String>();
          
          // add applet instances
          for(var appletInstance in cardperso[i]['appletInstanceProfiles']){
            cardId.appletInstances.add(JSON.decode(appletInstance));
          }
          for(var packageProfile in cardperso[i]['packageProfiles']){
            cardId.packageProfiles.add(JSON.decode(packageProfile));
          }
          
          for(var restrictedAid in cardperso[i]['restrictedAids']){
            cardId.restrictedAids.add(restrictedAid);  
          }
          
          mCardIdentifier.add(cardId);
        }
        
      }
      on Exception catch(e){
        print('Error: $e');
      }
      
    }
  }
  
  /**
   * Begin websocket communication with go server  
   */
  void startProcess(){
    webSocket.sendString("go");
  }
  
  /**
   * getCleanForm
   * 
   * Get div id=dialog-form
   * If there are child elements, remove them
   */
  DivElement getCleanForm() {
    
    DivElement div = querySelector("#dialog-form");//document.getElementById("dialog-form");

    if(null != div.children){
      div.children.clear();
      
    }
    return div;
  }


  /**
   * edit
   * 
   * Show package or applet instance informaition, allow user to edit
   */
  void edit(int index, var type) {    
    List list;
    ButtonElement button = new ButtonElement();
    button.name = index.toString();
    button.text = 'Done';
   
    DivElement div = getCleanForm();
    
    switch(type){
      case 'APPLET_INSTANCE':
        list = mCardIdentifier.elementAt(index).appletInstances;
        button.onClick.listen(onSaveAppletInstance);
        break;
        
      case 'PACKAGE_INSTANCE':
        list = mCardIdentifier.elementAt(index).packageProfiles;
        button.onClick.listen(onSavePackageInstance);
        break;
        
    }
    
    buildDialogFromList(list,div,index);
    div.children.add(button);
  
  }
  
  /**
   * buildDialogFromList
   * 
   * Get the list of instances, iterate over and create fields from map
   * 
   */
  void buildDialogFromList(List list, DivElement div, int selectedIndex){
    int childIndex = 0;
    FieldSetElement fs = new FieldSetElement();
    fs.id = 'dialog-fieldset';
    //Loop over json objects
    for(Map map in list) {
      buildDialogFromMap(map, fs, selectedIndex, childIndex++);
    }
    div.children.add(fs);
  }
  
  /**
   * buildDialogFromMap
   * Iterate over Json objects and create a dialog in DIV
   */
  void buildDialogFromMap(Map map, Element elem, int selectedIndex, int childIndex) {
    LabelElement label;
    TextInputElement input;
    ButtonElement button;
    Element e;
     
    map.forEach((k,v){
      
      //Create and add label
      label = new LabelElement();
      label.id = "fieldset-label";
      label.text = k.toString();            
      elem.children.add(label);

      switch(k){
        case 'instanceAID':
          input = new TextInputElement();
          input.value = v['aid'];
          input.name = k.toString();
          input.id = "fieldset-input";
          elem.children.add(input);
          break;
        case 'packageAID':
        case 'appletProfile':
          button = new ButtonElement();
          button.id = "fieldset-button";
          button.text = '...';
          button.name = k.toString() +"," + selectedIndex.toString()+ ","+childIndex.toString();
          button.onClick.listen(onProfile);
          elem.children.add(button);
          break;
        default:
          input = new TextInputElement();
          input.name = k.toString();
          input.id = "fieldset-input";
          input.value = v.toString();
          elem.children.add(input);
      }
      

    });    
  }
  
  /**
   * onProfile
   * 
   * Click applet instance or package profile button, display in dialog
   */
  void onProfile(Event e){
    Map map;
    ButtonElement button = e.target;
    List<String> indexes = button.name.split(',');
    String type = indexes[0];
    int selectedIndex = int.parse(indexes[1]);
    int childIndex = int.parse(indexes[2]);
     
    switch(type){
      case 'packageAID':
        map = mCardIdentifier.elementAt(selectedIndex).packageProfiles.elementAt(childIndex);
        break;
      case 'appletProfile':
        map = mCardIdentifier.elementAt(selectedIndex).appletInstances.elementAt(childIndex);
        break;
    }
    
    FieldSetElement fs = new FieldSetElement();
    buildDialogFromMap(map, fs, selectedIndex, childIndex);
    getCleanForm().children.add(fs); 
  }
  

  void onSavePackageInstance(Event e){
    getCleanForm(); 
  }
  
  /**
   * onSaveAppletInstance
   * index is the index of additionalInfo set as the Button.name corresponding
   * to the row clicked on to edit.
   */
  void onSaveAppletInstance(Event e){
    
    ButtonElement button = e.target;
    int index = int.parse(button.name);
    FieldSetElement fs = querySelector("#dialog-fieldset");
    int tagNdx =0;
    var tag;
    TextInputElement inputElem;
    CardIdentifier infoToSave = mCardIdentifier.elementAt(index);
    
    fs.children.forEach((c){
      if(c is TextInputElement){
        TextInputElement e = c;
        switch(e.name){
          case 'appletInstanceId':
            break;
          case 'instanceAID':
            break;
        }
        infoToSave.appletInstances;
      }
    });
    
    getCleanForm();
    
  }
  
  
  /**
   * Id was clicked, go get the additional parameters for the identifier
   */
  void getCard(String cardId) {
    var message = "more:" + cardId;
    webSocket.sendString(message);
  }
}
class MyAppModule extends Module {
  MyAppModule() {
    type(PersoController);
  }
}

void main() {
  ngBootstrap(module: new MyAppModule());
}

