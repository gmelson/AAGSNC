package main

import (
	"fmt"
	"log"
	"tux21b.org/v1/gocql"
    "perso"
    "encoding/json"
    "io"
    "strings"
    "os/exec"
    "net/http"
    "code.google.com/p/go.net/websocket"
)

const(
    cassandraAddress = "192.168.150.167"//"192.168.155.130"
    keyspaceName = "test_sequent_sptsm"
    cardDataQuery = `SELECT cardidentifier, applicationid, cardid, contentgroup, description, downloadexpdate, jsondata, nickname, status FROM card_info`
)
type CardPerso struct {
    Perso [] Persod `json:"cardperso"`
}

type Persod struct {
    Cardidentifier string `json:"cardidentifier"`
    Applicationid int `json:"applicationid"`
    Cardid int `json:"cardid"`
    Contentgroup string `json:"contentgroup"`
    Description string `json:"description"`
    Downloadexpdate int64 `json:"downloadexpdate"`
    rawdata string `json:"rawdata"`
    doc perso.Document `json:"persod"`
    Nickname string `json:"nickname"`
    Status int64 `json:"status"`
}


func getDocumentFromJsonData(card *perso.Document, input io.Reader) {
    //convert to structure
    dec := json.NewDecoder(input)
    for {
        err := dec.Decode(&card)
        if err != nil {
            if err == io.EOF {
                break
            }
            log.Fatal(err)
        }
    }

}

func serializeJsonData(card CardPerso) (data []byte){
    data, err := json.Marshal(card)
    if nil != err {
        log.Fatal(err)
    }

    return data
}

//func fetchCardData(session *gocql.Session, cardInfo *CardPerso) {

//    err := session.Query(`SELECT cardidentifier, applicationid, cardid, contentgroup, description, downloadexpdate, jsondata, nickname, status FROM card_info`).Scan(&cardInfo.Cardidentifier,&cardInfo.Applicationid, &cardInfo.Cardid, &cardInfo.Contentgroup,&cardInfo.Description, &cardInfo.Downloadexpdate,&cardInfo.rawdata, &cardInfo.Nickname, &cardInfo.Status)
//    if err != nil {
//        log.Fatal(err)
//    }

//}

func fetchCards()(card CardPerso) {

    card  = CardPerso {}
    cardInfo := Persod{}

    // connect to the cluster
    cluster := gocql.NewCluster(cassandraAddress)
    cluster.Keyspace = keyspaceName
    cluster.Consistency = gocql.One
    cluster.ProtoVersion = 1

    session, err := cluster.CreateSession()
    if err != nil {
        log.Fatal(err)
    }
    defer session.Close()

    iter := session.Query(cardDataQuery).Iter()
    for iter.Scan(&cardInfo.Cardidentifier,&cardInfo.Applicationid, &cardInfo.Cardid, &cardInfo.Contentgroup,&cardInfo.Description, &cardInfo.Downloadexpdate,&cardInfo.rawdata, &cardInfo.Nickname, &cardInfo.Status) {
        getDocumentFromJsonData(&cardInfo.doc, strings.NewReader(cardInfo.rawdata))
        card.Perso = append(card.Perso, cardInfo)
    }
    if err := iter.Close(); err != nil {
                log.Fatal("close:", err)
    }

    return card
}

func PersoServer(ws *websocket.Conn) {
    var command = make([]byte, 256)
    var j string
    n, err := ws.Read(command)
    if err != nil && n ==0 {
        log.Printf("Read: %v", err)
    } else {
        c := string(command[:n])
        
        card := fetchCards()

        fmt.Printf("action = %s", c)
        switch  {
        case strings.Contains(c, "go"):
            //convert structure into json
            j = string(serializeJsonData(card))
        case strings.Contains(c,"more"):
            action := strings.Split(c,":")
            fmt.Printf("got more request for: %s", action)
            for _, perso := range card.Perso {
                if perso.Cardidentifier == action[1]{
                    data, err := json.Marshal(perso.doc)
                    if nil != err {
                        log.Fatal(err)
                    }
                    j = string(data)

                }
            }
        }
        websocket.JSON.Send(ws,&j)
    }
}

func main(){

    cw := exec.Command("start", "\"\"","./startup.html")
    c := exec.Command("open", "-a", "Safari","./startup.html")
    switch {
        case c != nil: 
            c.Start()
        case c == nil: 
            cw.Start()
    }
    
    http.Handle("/perso", websocket.Handler(PersoServer))
    err := http.ListenAndServe(":12345", nil)
    if err != nil {
        panic("ListenAndServe: " + err.Error())
    }
    
    

}