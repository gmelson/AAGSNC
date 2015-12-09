package pbscafe

import (
	"time"
)

type Peers struct {
	Peers [] Peer 	`json:"peers"`
}

type Peer struct {
	Address 	string `json:"remoteAddr"`
	Status		string `json:"status"`
	Date 		time.Time `json:"date"`
}

