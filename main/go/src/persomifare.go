package main

import (
	"fmt"
	"log"
	"net/http"
	"encoding/json"
	"io/ioutil"
	"bytes"
	"io"
	"strings"
	"code.google.com/p/go.net/websocket"
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

const BEGIN_CONVERSATION = ``
const END_CONVERSATION = ``
const GET_DATA_SCRIPT = ``

type RequestProperties struct {
	Msdn	string `json:"msdn"`
	Aid		string `json:"aid"`
	Seid	string `json:"seid"`
	From	string `json:"from"`
	To		string `json:"to"`
	Qual	string `json:"serviceQualifier"`
	Op		string `json:"operationCode"`
	Id		string `json:"serviceId"`
	Command	string `json:"command"`
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

func begin(props RequestProperties) (results string) {
	soapRequestContent := fmt.Sprintf(BEGIN_CONVERSATION, props.From, props.From,props.To,props.Seid, props.Msdn,props.Id,props.Qual,props.Op)
	log.Printf("%s", soapRequestContent)
	xmlResponse := soapRequest(soapRequestContent, props.To + "/b2b/gp21/serviceLifeCycleNotification")

	log.Printf("XML response %s", xmlResponse)
	return "BEGIN"
}

func send(props RequestProperties, script string) (results string) {
	soapRequestContent := fmt.Sprintf(script, props.From, props.From,props.To,props.Seid, props.Msdn,props.Id,props.Qual,props.Op)
	log.Printf("%s", soapRequestContent)
	xmlResponse := soapRequest(soapRequestContent, props.To + "/b2b/gp21/serviceLifeCycleNotification")

	log.Printf("XML response %s", xmlResponse)
	return "SEND"
}

func end(props RequestProperties) (results string) {
	soapRequestContent := fmt.Sprintf(END_CONVERSATION, props.From, props.From,props.To,props.Seid, props.Msdn,props.Id,props.Qual,props.Op)
	log.Printf("%s", soapRequestContent)
	xmlResponse := soapRequest(soapRequestContent, props.To + "/b2b/gp21/serviceLifeCycleNotification")

	log.Printf("XML response %s", xmlResponse)
	return "END"
}

/**
 *	getData
 *	Call normal begin, send and end conversation
 *	For send, include the getData script
 *
 */
func getData(props RequestProperties)(results string){
	begin(props)
	send(props, GET_DATA_SCRIPT)
	end(props)
	return "getData"
}

func pushCard(props RequestProperties)(results string){
	begin(props)
	send(props, GET_DATA_SCRIPT)
	end(props)
	return "pushCard"
}
/**
 *	SEController
 *	Talks to SE with specified command in json object
 *
 */
func SEController(ws *websocket.Conn) {
	properties := RequestProperties {}

    var baJson = make([]byte, 1024)
    var j string
    
    // Read in websocket information 
    n, err := ws.Read(baJson)
    if err != nil && n ==0 {
        log.Printf("Read: %v", err)
    } else {
    
    	// Decode json from client
        jsonStr := string(baJson[:n])      
        dec := json.NewDecoder(strings.NewReader(jsonStr))
    	for {
        	err := dec.Decode(&properties)
        	if err != nil {
            	if err == io.EOF {
                	break
            	}
            	log.Fatal(err)
        	}
    	}

		// Determine command and execute
        fmt.Printf("action = %s", properties.Command)
        switch properties.Command{
        case "getData":
        	getData(properties)
        case "pushCard":
        	pushCard(properties)
        }
        websocket.JSON.Send(ws,&j)
    }
}




/**
 *	MAIN	
 *	
 */
func main() {
	var port = ":8380"
	
	// Setup websocket handler function
	http.Handle("/",  websocket.Handler(SEController))
	err := http.ListenAndServe(port, nil)
	if err != nil {
		panic("ListenAndServe: " + err.Error())
	}
	
	log.Printf("Listening on port: %s", port)
}
