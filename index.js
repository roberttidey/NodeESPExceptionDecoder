const express = require('express'); //Import the express dependency
const app = express();              //Instantiate an express app, the main work horse of this server
app.use(express.json());
const port = 5000;                  //Save the port number where your server will be listening
const { exec } = require("child_process");

const addr2Line = "C:/utils/Arduino2/portable/packages/esp8266/tools/xtensa-lx106-elf-gcc/3.0.4-gcc10.3-1757bed/bin/xtensa-lx106-elf-addr2line.exe -aipfC -e ";

const elfSearch = "C:/Users/robert/AppData/Local/Temp/arduino-sketch***/";
var elfFile;

const exceptions = [
		"Illegal instruction",
		"SYSCALL instruction",
		"InstructionFetchError: Processor internal physical address or data error during instruction fetch",
		"LoadStoreError: Processor internal physical address or data error during load or store",
		"Level1Interrupt: Level-1 interrupt as indicated by set level-1 bits in the INTERRUPT register",
		"Alloca: MOVSP instruction, if caller's registers are not in the register file",
		"IntegerDivideByZero: QUOS, QUOU, REMS, or REMU divisor operand is zero",
		"reserved",
		"Privileged: Attempt to execute a privileged operation when CRING ? 0",
		"LoadStoreAlignmentCause: Load or store to an unaligned address",
		"reserved",
		"reserved",
		"InstrPIFDataError: PIF data error during instruction fetch",
		"LoadStorePIFDataError: Synchronous PIF data error during LoadStore access",
		"InstrPIFAddrError: PIF address error during instruction fetch",
		"LoadStorePIFAddrError: Synchronous PIF address error during LoadStore access",
		"InstTLBMiss: Error during Instruction TLB refill",
		"InstTLBMultiHit: Multiple instruction TLB entries matched",
		"InstFetchPrivilege: An instruction fetch referenced a virtual address at a ring level less than CRING",
		"reserved",
		"InstFetchProhibited: An instruction fetch referenced a page mapped with an attribute that does not permit instruction fetch",
		"reserved",
		"reserved",
		"reserved",
		"LoadStoreTLBMiss: Error during TLB refill for a load or store",
		"LoadStoreTLBMultiHit: Multiple TLB entries matched for a load or store",
		"LoadStorePrivilege: A load or store referenced a virtual address at a ring level less than CRING",
		"reserved",
		"LoadProhibited: A load referenced a page mapped with an attribute that does not permit loads",
		"StoreProhibited: A store referenced a page mapped with an attribute that does not permit stores"
	];
	
function findElfFile(inoFile) {
	const fg = require('fast-glob');
	const fs = require('fs');
	var elfPaths = fg.sync(elfSearch+inoFile+'.elf', { absolute: true });
	var stats;
	var i;
	var t;
	var mostRecent = 0;
	var path;
	for(i = 0; i < elfPaths.length; i++) {
		try {
			stats = fs.statSync(elfPaths[i]);
			t = new Date(stats.mtime).getTime();
			if(t > mostRecent) {
				path = elfPaths[i];
				mostRecent = t;
			}
		} catch (error) {
			console.log(error);
		}
	}
	return path;
}

function decodeException(exceptionText){
	var match = exceptionText.match(/Exception \(([0-9]*)\):/);
	var result = "Exception Cause: "; 
	if (!match) {
		result += "Not found";
	} else {
		var exceptionNo = parseInt(match[1], 10);
		result += match[1] + " ";
		if (exceptionNo >= 0 && exceptionNo < exceptions.length) {
			result += " [" + exceptions[exceptionNo] + "]";
		} else {
			result += " [Unknown]";
		}
	}
	return result;
}

function parseStackTrace(exceptionText){
	var match = exceptionText.match(/40[0-2][0-9a-f]{5}\b/g);
	var cmd = addr2Line + elfFile + " " + match.join(" ");
	var result;
	try {
		result = require('child_process').execSync(cmd).toString();
	} catch (error) {
		result = error;
	}
	return result.split(/\r?\n/);
}

//Idiomatic expression in express to route and respond to a client request
//get requests to the root ("/") will route here
app.get('/', (req, res) => {
	//send index.html file
	res.sendFile('index.html', {root: __dirname});
});

//get requests to decode exception will route here
app.post('/decode', (req, res) => {
	var exceptionR;
	var stackR;
	if (req.body.inoFile && req.body.exceptionInput) {
		elfFile = findElfFile(req.body.inoFile);
		if (elfFile) {
			try {
				exceptionR = decodeException(req.body.exceptionInput);
				stackR = parseStackTrace(req.body.exceptionInput);
			}
			catch (error){
				exceptionR = error;
				stackR = ["undecoded"];
			}
		}
	}
	res.json({exception:exceptionR, stack:stackR});
});


app.listen(port, () => {            //server starts listening for any attempts from a client to connect at port: {port}
    console.log(`Now listening on port ${port}`); 
});

