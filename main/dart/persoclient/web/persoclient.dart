import 'dart:async';
import 'dart:html';
import 'dart:convert';
import 'dart:js' show context, JsObject;
import 'package:angular/angular.dart';

class AdditionalInfo{
  String name;
  String value;
  List<Tag>tags;
  
  AdditionalInfo(this.name, this.value, this.tags);
}

class Tag{
  String tag;
  String value;
  String belongsto;
  
  Tag(this.tag, this.value, this.belongsto);
}

@NgController(
    selector: '[perso-client]',
    publishAs: 'perso')
class PersoController {
  
  static const Duration RECONNECT_DELAY = const Duration(milliseconds: 500);

  bool connectPending = false;
  WebSocket webSocket;
  String cardidentifier_text_id; 
  List<AdditionalInfo>additionalInfo;

  
  PersoController(){
    additionalInfo = new List<AdditionalInfo>();
   
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
    //double decode hack
    var response = JSON.decode(JSON.decode(data));
    var cardperso = response['cardperso'];
    if(cardperso != null && cardperso[0] != null){
      try{
        
        cardidentifier_text_id = cardperso[0]['profileId'];  
      }
      on Exception catch(e){
        print('Error: $e');
      }
      
    }
    else if((cardperso = response['dgi']) != null){
      var _tags = new List<Tag>();
      
      additionalInfo.clear();
      for(var persod in cardperso){
        
        //name:, minLength:, maxLength: ,recordTemplate:, tags: [{tag: 5F2D, value: 7275, belongsTo: 9102}, {tag: 9F38, value: 9F66049F02069F03069F1A0295055F2A029A039C019F37049F4E14, belongsTo: 9102}, {tag: BF0C, value: 9F4D02140A, belongsTo: 9102}]}, {name: A102, minLength: 0, maxLength: 0, recordTemplate: 6F, tags: [{tag: 84, value: A0000000031010, belongsTo: A102}, {tag: A5, value: 500B5669736120437265646974, belongsTo: A102}]}, {name: 9207, minLength: 0, maxLength: 0, tags: [{tag: 82, value: 0000, belongsTo: 9207}, {tag: 94, value: , belongsTo: 9207}]}, {name: 3001, minLength: 0, maxLength: 0, tags: [{tag: 57, value: , belongsTo: 3001}, {tag: 5F20, value: 202F, belongsTo: 3001}, {tag: 5F34, value: , belongsTo: 3001}, {tag: 9F50, value: 00000000, belongsTo: 3001}, {tag: 9F51, value: 0643, belongsTo: 3001}, {tag: 9F52, value: 00000100, belongsTo: 3001}, {tag: 9F53, value: 00, belongsTo: 3001}, {tag: 9F68, value: 00180000, belongsTo: 3001}, {tag: 9F6B, value: 000000100000, belongsTo: 3001}, {tag: 9F6C, value: 0000, belongsTo: 3001}, {tag: 9F6E, value: 23000000, belongsTo: 3001}]}, {name: 9200, minLength: 0, maxLength: 0, tags: [{tag: 9F10, value: 06010A03000000, belongsTo: 9200}]}, {name: 8000, value: , minLength: 0, maxLength: 48}, {name: 9000, value: , minLength: 0, maxLength: 9}]
        
        var tagjson = persod['tags'];
       
        for(var tag in tagjson){
          _tags.add(new Tag(tag['value'], tag['value'], tag['belongsTo']));
        }
        additionalInfo.add(new AdditionalInfo(persod['name'],persod['value'],_tags));
      }
      
      //JavaScript call to force reload of flexi grid
      context.callMethod('reloadgrid',[]);

    }
  }
  /**
   * Begin websocket communication with go server  
   */
  void startProcess(){
    webSocket.sendString("go");
  }
  
  void editRow(int index) {
    DivElement div = new DivElement();
    
  }
  
  /**
   * Id was clicked, go get the additional parameters for the identifier
   */
  void getCard() {
    var message = "more:" + cardidentifier_text_id;
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
  //var client = new PersoC();
  //querySelector("#start_text_id")
  //  ..text = "Click me!"
   // ..onClick.listen(client.startProcess);
  //querySelector("#cardidentifier_text_id")
   // ..onClick.listen(client.getcard);
}

