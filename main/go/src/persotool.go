package main

import (
	"fmt"
	"log"
	"tux21b.org/v1/gocql"
    "encoding/json"
    "strings"
    "os/exec"
    "net/http"
    "code.google.com/p/go.net/websocket"
)

type Node []byte


const(
    cassandraAddress = "192.168.155.131"
    keyspaceName = "test_sequent_setsm"
    walletDataQuery = `SELECT walletid, deviceprofileid, seprofileid, appletinstanceprofiles, deviceprofile, issuerid, packageprofiles, registrationstatus,restrictedaids, sdprofileid, securitydomainserviceendptnid, seprofile FROM wallet_perso_profile`
    //walletDataQuery = `SELECT walletid, deviceprofileid, seprofileid, appletinstanceprofiles, deviceprofile,issuerid, packageprofiles, registrationstatus,restrictedaids FROM wallet_perso_profile`

)
type CardPerso struct {
    Perso [] Persod `json:"cardperso"`
}

type Persod struct {
    WalletId string`json:"walletId"`
    DeviceProfileId string `json:"deviceProfileId"`
    SeProfileId string `json:"seProfileId"`
    AppletInstanceProfiles map[int64]Node `json:"-"`
    AppletJson []string `json:"appletInstanceProfiles"`
    DeviceProfile string `json:"deviceProfile"`
    IssuerId int64 `json:"issuerId"`
    PackageProfiles map[int64]Node `json:"-"`
    PackageJson []string `json:"packageProfiles"`
    RegistrationStatus string `json:"registrationStatus"`
    RestrictedAids []string `json:"restrictedAids"`
    SdProfileId string `json:"sdProfileId"`
    SecurityDomainServiceendPtnId string `json:"secDomainServId"`
    SeProfile string `json:"seProfile"`
}


func serializeJsonData(card CardPerso) (data []byte){
    data, err := json.Marshal(card)
    if nil != err {
        log.Fatal(err)
    }

    return data
}

func copyMapToJson(aMap map[int64]Node)([]string){
    var jsonStr [] string

    for _, value := range aMap {
        jsonStr = append(jsonStr, fmt.Sprintf("%s",value))
    }

    return jsonStr
    //return fmt.Sprintf("%s", jsonStr)

}

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

    iter := session.Query(walletDataQuery).Iter()
    for iter.Scan(&cardInfo.WalletId, &cardInfo.DeviceProfileId, &cardInfo.SeProfileId, &cardInfo.AppletInstanceProfiles, &cardInfo.DeviceProfile, &cardInfo.IssuerId, &cardInfo.PackageProfiles, &cardInfo.RegistrationStatus,&cardInfo.RestrictedAids, &cardInfo.SdProfileId, &cardInfo.SecurityDomainServiceendPtnId, &cardInfo.SeProfile) {
        cardInfo.AppletJson = copyMapToJson(cardInfo.AppletInstanceProfiles)
        log.Printf("AppletInstanceProfiles = %s", cardInfo.AppletJson)
        cardInfo.PackageJson = copyMapToJson(cardInfo.PackageProfiles)
        log.Printf("%s", cardInfo.PackageJson)

        card.Perso = append(card.Perso, cardInfo)
    }
    if err := iter.Close(); err != nil {
                log.Fatal("scan problem:", err)
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

        //More based on SeProfileId
        fmt.Printf("action = %s \n", c)
        if strings.Contains(c,"go") {
            j = fmt.Sprintf("%s",serializeJsonData(card))    
        }

        /*
        switch  {
        case strings.Contains(c, "go"):
            //convert structure into json
            j = fmt.Sprintf("%s",serializeJsonData(card))

        case strings.Contains(c,"more"):
            action := strings.Split(c,":")
            fmt.Printf("got more request for: %s", action)
            for _, perso := range card.Perso {
                if perso.SeProfileId == action[1]{
                    j = fmt.Sprintf("%s", perso.JsonData)

                }
            }
        }
        */
        websocket.JSON.Send(ws,&j)
    }
}

func main(){

    cw := exec.Command("start", "\"\"","./persoclient.html")
    c := exec.Command("open", "-a", "Safari","./persoclient.html")
    switch {
        case c != nil: 
            c.Start()
        case c == nil: 
            cw.Start()
    }
    
    http.Handle("/perso", websocket.Handler(PersoServer))
    err := http.ListenAndServe(":12345", nil)
    //err := http.ListenAndServeTLS(":12345", "jan.newmarch.name.pem","private.pem", nil)

    if err != nil {
        panic("ListenAndServe: " + err.Error())
    }
    
    

}
