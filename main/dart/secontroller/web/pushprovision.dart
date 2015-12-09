import 'dart:html';
import 'package:angular/angular.dart';
import 'dart:async';
import 'dart:convert';
import 'soap.dart';

class PersoData {
  String msdnText;
  String aidText = 'A0000003964D66344D0002';
  String seidText = '47902207029320961688';
  String fromDomainText = 'http://192.168.155.130:8280';
  String toDomainText = 'http://192.168.150.176:8280';
  String serviceQualifierText = '300:1002111111111111';
  String operationCodeText = '1';
  String serviceIdText = '301';  
}

class State {
  int nextState;
  int currState;
  int process;
  
  //processes
  static const int GET_STATUS = 0;
  static const int GET_COUNTER = 1;
  
  //states
  static const int SE_COMMAND = 3;
  static const int BEGIN_CONVERSATION = 0;
  static const int SEND_SCRIPT = 1;
  static const int END_CONVERSATION =2;

  var state = {
      SE_COMMAND: '/b2b/gp21/cardContentManagement',
      BEGIN_CONVERSATION:'/b2b/gp21/scriptSending',
      SEND_SCRIPT : '/b2b/gp21/scriptSending',
      END_CONVERSATION : '/b2b/gp21/scriptSending'
  };

  State(this.process, this.currState);
  
  void step(){
    this.currState = this.nextState;
  }
  
  bool checkStep(var responseXml){
    bool retVal = true;
    switch(this.process) {
        case GET_STATUS:
          retVal = getStatusState(responseXml);
          break;
        case GET_COUNTER:
          retVal = getCounterState();
          break;
    }
    
    return retVal;
  }
  
  bool getCounterState(){
    switch(currState){
      case SE_COMMAND:
        nextState = BEGIN_CONVERSATION;
        break;
      case BEGIN_CONVERSATION:
        nextState = SEND_SCRIPT;
        break;
      case SEND_SCRIPT:
        nextState = END_CONVERSATION;
        break;
    }
    
    return nextState != currState;
  }
  
  bool getStatusState(var xml){
    switch(currState){
      case SE_COMMAND:
        nextState = BEGIN_CONVERSATION;
        break;
      case BEGIN_CONVERSATION:
        nextState = SEND_SCRIPT;
        break;
      case SEND_SCRIPT:
        nextState = END_CONVERSATION;
        break;
    }
    return nextState != currState;
  }
}

@NgController(
    selector: '[provision-client]',
    publishAs: 'provision')
class ProvisionController{

  static const Duration RECONNECT_DELAY = const Duration(milliseconds: 500);

  bool connectPending = false;
  WebSocket webSocket;
  PersoData perso;
  static State state;
  String persoError = '';
  bool isBusy =false;
  String step;
 
  ProvisionController(){
    perso = new PersoData();
    showWait(false);
      
    //GAM for websocket connect();
  }
  
  void post(var url, var soap){
    var encodedData = Uri.encodeComponent(soap);
    var httpRequest = new HttpRequest();
    httpRequest.open('POST', url);
    httpRequest.setRequestHeader('Content-type', 
    'text/xml');
    httpRequest.onLoadEnd.listen((e) => loadEnd(httpRequest));
    httpRequest.send(encodedData);    

  }
  
  loadEnd(HttpRequest request) {
    if (request.status != 200 && request.status !=0) {
      print('Uh oh, there was an error of ${request.status}');
      showWait(false);
    } else {
      
      if(state.checkStep(request.responseXml)){
        postSoap(state.currState);
        state.step();
      }
      print('Data has been posted');
    }
  }

  void postSoap(int aState){
    SoapData.fromDomain = perso.fromDomainText;
    SoapData.toDomain = perso.toDomainText;
    SoapData.phone = perso.msdnText;
    SoapData.operationCode = perso.operationCodeText;
    SoapData.SEID = perso.seidText;
    SoapData.serviceId = perso.serviceIdText;
    SoapData.serviceQualifier = perso.serviceQualifierText;

    var url = perso.toDomainText + state.state[aState];
    var soap;
    switch(aState){
      case State.SEND_SCRIPT:
        soap = SoapData.SEND_SCRIPT;
        break;
      case State.BEGIN_CONVERSATION:
        soap = SoapData.BEGIN_CONVERSATION;
        break;
      case State.END_CONVERSATION:
        soap = SoapData.END_CONVERSATION;
        break;
      case State.SE_COMMAND:
        soap = SoapData.SE_REMOTE_EXECUTION;
        break;
    }
    
    post(url,soap);
    
  }
  
  void startPush(){
    showWait(true);
    
    state = new State(State.GET_STATUS, State.BEGIN_CONVERSATION);
    postSoap(state.currState);
  }

  void sendWebSocket(){
    Map map = new Map();
    map["msdn"] = perso.msdnText;
    map["aid"] = perso.aidText;
    map["seid"] = perso.seidText;
    map["from"] = perso.fromDomainText;
    map["to"] = perso.toDomainText;
    map["serviceQualifier"] = perso.serviceQualifierText;
    map["operationCode"] = perso.operationCodeText;
    map["serviceId"] = perso.serviceIdText;
    map["command"] = "getData";
    
    webSocket.sendString(JSON.encode(map));

  }
  
  /**
   * show spinner based on flag
   */
  void showWait(bool show){
    List<DivElement>waitSpin = document.body.getElementsByClassName(".spinner");
    waitSpin[0].hidden = !show;
  }
  
  /**
   * display errorStr, if no errorStr hide
   */
  void showError(String errorStr){
    List<DivElement>errorDiv = document.body.getElementsByClassName(".error");
    errorDiv[0].hidden = (null == errorStr || errorStr.length <= 0);
    step = errorDiv[0].hidden.toString();
  }
  


// ================ WebSocket handler

  void connect() {
    connectPending = false;
    webSocket = new WebSocket('ws://127.0.0.1:12345');
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
    
      
    }

}

//================= Main and Module app

class MyAppModule extends Module {
  MyAppModule() {
    type(ProvisionController);
   
  }
}

void main() {
  ngBootstrap(module: new MyAppModule());
}


