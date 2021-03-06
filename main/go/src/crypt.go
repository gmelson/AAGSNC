package main

import (
	"fmt"
	"os"
	"log"
	"encoding/json"
	"io"
	"net/http"	
	"perso"
)

// Store property file information
type ConfigInfo struct {
	url string
	username string
	password string
	path string
}

/**
 * Back up existing property files sharedApplication.properties, and 
 * update "repo.encrypt.data" by setting to true
 */
func updateProperty(config ConfigInfo)error{
	//var replacebuf string
	var buf = make([]byte, 1024 *6)	

	log.Printf("Updating property file path: %s\n", config.path)
	//property_file, err := os.OpenFile(config.path, os.O_RDWR, os.)
	property_file, err := os.Open(config.path)
	if err != nil {
		return err
	}

	property_file.Read(buf )
	//replacebuf = string(buf)
	//strings.Replace(replacebuf, "repo.encrypt.data=false", "repo.encrypt.data=true", 1)

	return nil
}

/**
 * Marshall json data into CardInfo data structure
 * Encrypt individual fields usine AES
 * Write data back out => this should be http POST to Cloudant
 */
func encryptCardInfo(input io.Reader){

	var card perso.CardInfo

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

		// Convert internal structure back to json
		data, err := json.Marshal(card)
		if err != nil {
			log.Fatal(err)
		}

		//Use POST command to send JSON back to Cloudant
		fmt.Printf("%s\n", data)

	}
}

// function for doing AES encryption of data
type encrypt func (card *perso.CardInfo) (data string)

/**
 *  Main entry point for application
 */
func main() {

	var config ConfigInfo
	var choice int

	// Promp user for install parameters
	fmt.Print("Select (1) for SP or (2) for SE: ")
	fmt.Scanf("%s", &choice)

	//set config structure, this may be read from config.properties file
	switch choice{
		case 1:
			config.path = "sharedApp.properties"//"/opt/jboss/server/sp_tsm/conf/application.properties"
			config.url=""
		case 2:
			config.path="sharedApp.properties"//"/opt/jboss/server/se_tsm/conf/application.properties"
			config.url =""
	}

	// Update SP or SE sharedApp.properties files with new "true" value
	if updateProperty(config) != nil{
		log.Printf("Unable to update config file for path: %s", config.path)
	}

	//debug
	var test int = 1

	// read test data from disk
	if 1 == test {
		input, err := os.Open("cardInfo.json")
		if err != nil {
			log.Fatal(err)
		}
		encryptCardInfo(input)

	}else {
		// make call to Cloudant
		resp, err := http.Get("http://example.com/")
		if err != nil {
			log.Fatal(err)
		}
		encryptCardInfo(resp.Body)
	}


}

