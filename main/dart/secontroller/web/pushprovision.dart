import 'dart:html';
import 'package:angular/angular.dart';
import 'dart:async';
import 'dart:convert';

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

@NgController(
    selector: '[provision-client]',
    publishAs: 'provision')
class ProvisionController{

  static const Duration RECONNECT_DELAY = const Duration(milliseconds: 500);

  bool connectPending = false;
  WebSocket webSocket;
  PersoData perso;
  
  String persoError = '';
  bool isBusy =false;
  String step;
 
  ProvisionController(){
    perso = new PersoData();
    hideWait(true);
      
    connect();
  }
  
  void startPush(){
    hideWait(false);
    showError(persoError = "it worked");
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
  void hideWait(bool hide){
    List<DivElement>waitSpin = document.body.getElementsByClassName(".spinner");
    waitSpin[0].hidden = hide;
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


