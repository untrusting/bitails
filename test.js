const Bitails = require('./src/index.js')

const mainAddress = "16Rcy7RYM3xkPEJr4tvUtL485Fuobi8S7o"
const testAddress = "mhcSJ3eF5f2Bf7mVQfceXXeLNQMBF3vqCv"


function networkMain(ex, cb){
	let status = ex.status().then((estado) => {
	console.log("Estado de Red")
    console.log(estado);
   	ex.chainInfo().then((info)=>{
   		console.log(info)
   		ex.blockHeight(0).then((genesis)=>{
   			console.log("Hash Bloque Genesis:",genesis.hash);
   			ex.blockLatest().then((ultimo)=>{
   				console.log("Último bloque:", ultimo.hash);
   				console.log("Número de transacciones: ",ultimo.transactionsDetails.length)
   			})
   		})
   	})

	}).then(()=>{
		cb(ex, mainAddress)
	})
}

function addressRoutine(ex, address, cb){
	 console.log("Balance of "+address)
	 ex.balance(address).then(function(b) {
        console.log(b);
				 ex.utxos(address).then(function(utxos) {
		        	 console.log("Mostrando "+utxos.unspent.length +"Utxos of "+address)

			        console.log(Object.keys(utxos) )
			        console.table(utxos.unspent)
			        	 ex.history(address).then(function(historial) {
			        	 	console.log("Historial de "+address)
			        		console.log(Object.keys(historial) )
			        		
			        		console.log(historial.history.length+" Resultados del historial:");
					        console.table(historial.history)
					        cb

			   			 });
			    });


    });
}

function testnet(testex){
	 addressRoutine(testex, testAddress, process.exit(0))

}

const mainex = new Bitails("main");
const testex = new Bitails("test");

testnet(testex)
networkMain(mainex, addressRoutine)
/*
{
  address: '16Rcy7RYM3xkPEJr4tvUtL485Fuobi8S7o',
  scripthash: '51268a643b2d4569263086daf88fa1e0b50c8530894842108891299750da7072',
  confirmed: 543516275,
  unconfirmed: 236964,
  summary: 543753239,
  count: 1987921
}*/