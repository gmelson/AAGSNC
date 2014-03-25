package main

import (
	"fmt"
	"log"
	"net/http"
	"encoding/json"
	"io/ioutil"
	"bytes"
	"io"
)
const SERVICE_CHANGE_NOTIFICATION = `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://namespaces.globalplatform.org/systems-messaging/2.1.0">
<soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
<wsa:Action>http://globalplatform.org/servicelifecyclenotification/ServiceLifeCycleNotification/HandleStartServiceStateChangeNotification</wsa:Action>
<wsa:From>
<wsa:Address>%s/b2b/</wsa:Address>
</wsa:From>
<wsa:MessageID>%s/b2b/e4931f2c-943a-41af-a239-8bcc6df2de8c</wsa:MessageID>
<wsa:To>%s/b2b/gp21/serviceLifeCycleNotification</wsa:To>
</soap:Header>
<soap:Body>
<ns:HandleStartServiceStateChangeNotificationRequest>
<ns:FunctionCallIdentifier>d5561b77-ca85-4db3-8eac-f27944e2c063</ns:FunctionCallIdentifier>
<ns:SecureElement xsi:type="ns:SEId_CardUniqueDataType" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<ns:CardUniqueData>%s</ns:CardUniqueData>
</ns:SecureElement>
<ns:MobileSubscription xsi:type="ns:MSId_MSISDNType" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<ns:MSISDN>%s</ns:MSISDN>
</ns:MobileSubscription>
<ns:NewService>
<ns:ServiceId>%s</ns:ServiceId>
<ns:ServiceVersion>
<ns:MajorVersion>1</ns:MajorVersion>
<ns:MinorVersion>1</ns:MinorVersion>
<ns:RevisionVersion>1</ns:RevisionVersion>
</ns:ServiceVersion>
</ns:NewService>
<ns:NewServiceQualifier>
<ns:Qualifier>%s</ns:Qualifier>
</ns:NewServiceQualifier>
<ns:Operation>%s</ns:Operation>
</ns:HandleStartServiceStateChangeNotificationRequest>
</soap:Body>
</soap:Envelope>`


type RequestProperties struct {
	Msdn	string `json:"msdn"`
	Aid		string `json:"aid"`
	Seid	string `json:"seid"`
	From	string `json:"from"`
	To		string `json:"to"`
	Qual	string `json:"serviceQualifier"`
	Op		string `json:"operationCode"`
	Id		string `json:"serviceId"`
}


func soapRequest(soapRequestContent string, url string)(xmlResponse string) {
	log.Printf("%s", url)
	httpClient := new(http.Client)
	resp, err := httpClient.Post(url, "text/xml; charset=utf-8", bytes.NewBufferString(soapRequestContent))
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("%s", resp)
	b, e := ioutil.ReadAll(resp.Body)
	if e != nil {
		log.Fatal(err)
	}

	return string(b)
}

func step1(props RequestProperties) (results string) {
	soapRequestContent := fmt.Sprintf(SERVICE_CHANGE_NOTIFICATION, props.From, props.From,props.To,props.Seid, props.Msdn,props.Id,props.Qual,props.Op)
	log.Printf("%s", soapRequestContent)
	xmlResponse := soapRequest(soapRequestContent, props.To + "/b2b/gp21/serviceLifeCycleNotification")

	log.Printf("XML response %s", xmlResponse)
	return "step1 Complete"
}

func start(w http.ResponseWriter, req *http.Request) {

	properties := RequestProperties {}
	dec := json.NewDecoder(req.Body)
	for {
		err := dec.Decode(&properties)
		if err != nil {
			if err == io.EOF{
				break;
			}
			log.Fatal(err)
		}
	}
	log.Printf("properties %s",properties)
	fmt.Fprint(w,step1(properties))
}


func PushMifare(ws *websocket.Conn) {
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
            j = fmt.Sprintf("%s",serializeJsonData(card))
        case strings.Contains(c,"more"):
            action := strings.Split(c,":")
            fmt.Printf("got more request for: %s", action)
            for _, perso := range card.Perso {
                if perso.ProfileId == action[1]{
                    j = fmt.Sprintf("%s", perso.JsonData)
                    //j = html.UnescapeString(perso.JsonData)

                }
            }
        }
        websocket.JSON.Send(ws,&j)
    }
}



func main() {
	http.Handle("/mifare",  websocket.Handler(PushMifare))
	err := http.ListenAndServe(":8380", nil)
	if err != nil {
		panic("ListenAndServe: " + err.Error())
	}
}
