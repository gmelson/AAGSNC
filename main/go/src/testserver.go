package main

import (
	"fmt"
	"log"
)


func main(){
	var what string
	_, err := fmt.Scanf("%s",&what);
	if err != nil {
		log.Fatal("yikes")
	}
	
	if what == "truth" {
		fmt.Printf("\nlies\n")
	}
}

