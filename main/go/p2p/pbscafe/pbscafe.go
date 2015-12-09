package pbscafe

import (
	"fmt"
	"net/http"
	"time"

	"appengine"
	"appengine/datastore"

	"encoding/json"
)

type Peers struct {
	Peers [] Peer 	`json:"peers"`
}

type Peer struct {
	Address 	string `json:"remoteAddr"`
	Status		string `json:"status"`
	Date 		time.Time `json:"date"`
}

func init() {
	http.HandleFunc("/", handler)
	http.HandleFunc("/peers", peers)
	http.HandleFunc("/register", register)

}

func isValidKey() (bool){
	return true
}


/**
 * Show all available assets on the site
 */
func handler(w http.ResponseWriter, r *http.Request) {

	fmt.Fprint(w, "List all available media")
	//if isValidKey(aKey) {
	//}
}

/** 
 * Get all available peers in JSON format
 */
func peers(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	query := datastore.NewQuery("Peers").Order("-Date").Limit(10)
	peers := make([] Peer, 0, 10)
	if _, err := query.GetAll(ctx, &peers); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	peerContainer := Peers{
		Peers: peers,
	}
	data, err := json.Marshal(peerContainer)
    if nil != err {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
    }
    fmt.Fprintf(w, "%s", string(data))
}

/**
 * Register a peer IP address
 */
 func register(w http.ResponseWriter, r *http.Request) {
 	ctx := appengine.NewContext(r)
 	fmt.Fprintf(w, "remote address %s", r.RemoteAddr)
 	peer := Peer{
 		Address: r.RemoteAddr,
 		Status: "active",
 		Date: time.Now(),
 	}
 	fmt.Fprintf(w, "Peer to save %s", peer)
 	key := datastore.NewKey(ctx, "Peers", r.RemoteAddr, 0, nil)
 	_, err := datastore.Put(ctx, key, &peer)

 	if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }


 }

