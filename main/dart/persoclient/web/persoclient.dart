import 'dart:async';
import 'dart:html';
import 'dart:convert';
import 'dart:js' show context, JsObject;

class PersoClient {
  
  static const Duration RECONNECT_DELAY = const Duration(milliseconds: 500);

  bool connectPending = false;
  WebSocket webSocket;
  
  PersoClient(){
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
      var cardidentifier = cardperso[0]['cardidentifier'];
      querySelector("#cardidentifier_text_id").text = cardidentifier;   
      querySelector("#description_text_id").text = cardperso[0]['description'];      
    }
    else if((cardperso = response['additionalParams']) != null){
      Element tbody = querySelector("#results");
      tbody.children.clear();

      //iterate over results and add table rows
      var tr =null;
      for(var persod in cardperso){
        tr = new TableRowElement();
        tr.children.add(new TableCellElement()..innerHtml = persod['name']);
        tr.children.add(new TableCellElement()..innerHtml = persod['value']);        
        tbody.children.add(tr);
      }
      
      //JavaScript call to force reload of flexi grid
      context.callMethod('reloadgrid',[]);

    }
  }
  /**
   * Begin websocket communication with go server  
   */
  void startProcess(Event e){
    webSocket.sendString("go");
  }
  
  /**
   * Id was clicked, go get the additional parameters for the identifier
   */
  void getcard(Event e) {
    var message = "more:" + querySelector("#cardidentifier_text_id").text;
    webSocket.sendString(message);
  }
}

void main() {
  var client = new PersoClient();
  querySelector("#start_text_id")
    ..text = "Click me!"
    ..onClick.listen(client.startProcess);
  querySelector("#cardidentifier_text_id")
    ..onClick.listen(client.getcard);
}

