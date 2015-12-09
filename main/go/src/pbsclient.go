package main

import (
	"fmt"
	"log"
    "net/http"
    "encoding/json"
    "pbscafe"
    "io"
    "code.google.com/p/go.net/websocket"
)

func PrivateServer(ws *websocket.Conn) {

}

func getPeersFromJsonData(peers *pbscafe.Peers, input io.Reader) {
    //convert to structure
    dec := json.NewDecoder(input)
    for {
        err := dec.Decode(&peers)
        if err != nil {
            if err == io.EOF {
                break
            }
            log.Fatal(err)
        }
    }

}

func runserver() {
    http.Handle("/private", websocket.Handler(PrivateServer))
    err := http.ListenAndServe(":12345", nil)
    if err != nil {
        panic("ListenAndServe: " + err.Error())
    }

}

func main() {
    go http.Get("http://pbscafe.appspot.com/register")
	resp, err := http.Get("http://pbscafe.appspot.com/peers")
	if err != nil {
		log.Fatal(err)
	}
	//json, err := ioutil.ReadAll(resp.Body)
	peers := pbscafe.Peers{}
	getPeersFromJsonData(&peers, resp.Body)
	resp.Body.Close()
	if err != nil {
		log.Fatal(err)
	}

    go runserver()
    
	fmt.Printf("response %s", peers)
}