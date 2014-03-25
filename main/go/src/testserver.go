package main

import (
	"fmt"
    "net/http"
    "code.google.com/p/go.net/websocket"
)

func TestServer(ws *websocket.Conn) {
	fmt.Printf("%s", "help")
}


func main(){
    
    http.Handle("/", websocket.Handler(TestServer))
    err := http.ListenAndServe(":12345", nil)

    if err != nil {
        panic("ListenAndServe: " + err.Error())
    }
    
    

}

