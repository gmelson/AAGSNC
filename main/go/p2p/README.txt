Setup the goapp path
export PATH="~/Projects/go_appengine:$PATH"

Test local deploy
goapp serve

To deploy the app defined in yaml file:
goapp deploy p2p/

Directory structure
app.yaml => contains definitiion for appengine application
client.go => contains consumer of appengine application
pbscafe => directory where appengine application is defined
