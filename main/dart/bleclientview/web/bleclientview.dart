import 'dart:html';
import 'package:angular/angular.dart';
import 'package:js/js.dart' as js;

@NgController(
    selector: '[ble-client]',
    publishAs: 'ble')
class BleController {
  BleController(){

  }
  
}


class MyAppModule extends Module {
  MyAppModule() {
    type(BleController);
   
  }
}

void update(String str){
  DivElement div = document.getElementById('results');
  LabelElement text = new LabelElement();
  text.text = str;
  div.children.add(text);
 
  div.children.add(new BRElement());
  
}

void clearText(){
  document.getElementById('results').children.clear();  
}

void main() {
  ngBootstrap(module: new MyAppModule());
  js.context.updateText = (str) => update(str);
  js.context.clearText = clearText;
}
