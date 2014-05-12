
encryptperso is a utility for taking card data and doint AES encryption.

$encryptperso [--file (full filename)]
Starting encryptperso with no command line arguments will prompt for information.

For web mode:
$requestcard [--host (iP of host SP) --spport (port of SP) --port (listen port)]

When requestcard is run with command line options it will listen on port for calls to
	/seqprovv	- checks eligibility of device and provisions card as specified by token
	/seqchke	- checks eligibility
	
	all web request have parameters
	?msdn=[device number]&token=[token of card]
token corresponds to .enc name

For command line mode
$requestcard
Starting requestcard with no command line arguments will prompt for information.

DIT stable:
SE - 192.168.150.176
SP - 192.168.155.130

Dominica DIT:
SE - 192.168.155.164 
SP - 192.168.155.170
WMP- 192.168.155.139

Dominica QA:
SE - 192.168.155.108
SP - 155.109
DB - 150.185

Example Phone number:
phone 1000 000 2938

Binaries for specific environments are contained in the following directories
	./windows
	./linux
	./darwin
