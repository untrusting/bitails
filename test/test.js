const Bitails = require('../src/index.js')

const mainAddress = "16Rcy7RYM3xkPEJr4tvUtL485Fuobi8S7o"
const mainScriptHash = "0c03b02d68a3590137b2cd8eed603009c809de8f5f0c72dded16e49f377c71e0"

const testAddress = "mhcSJ3eF5f2Bf7mVQfceXXeLNQMBF3vqCv"



const mainex = new Bitails("main");
const testex = new Bitails("test");


	mainex.mempoolInfo().then((memInfo)=>{
		console.log(memInfo)
	})
	mainex.mempoolTxs().then((memTxs)=>{
		console.log(memTxs)
	})

	mainex.addressInfo("18t6VHyC8gWqj5LjQcKoLN8v9JPY83HwYd").then((addrInfo)=>{
		console.log(addrInfo)
	})
	mainex.balance("18t6VHyC8gWqj5LjQcKoLN8v9JPY83HwYd").then((balance)=>{
		console.log(balance)
	})

	mainex.history("18t6VHyC8gWqj5LjQcKoLN8v9JPY83HwYd").then((historial)=>{
		console.log(historial)
	})

	mainex.utxos(mainAddress).then((utxos)=>{
		console.log(utxos)
	})

	mainex.detailsScriptHash(mainScriptHash).then((detailsScriptHash)=>{
		console.log(detailsScriptHash)
	})

	mainex.historyByScriptHash(mainScriptHash).then((scriptHashHistorial)=>{
		console.log(scriptHashHistorial)
	})

	mainex.utxosByScriptHash(mainScriptHash).then((utxosByScriptHash)=>{
		console.log(utxosByScriptHash)
	})
	
	mainex.balanceScriptHash(mainScriptHash).then((balanceSH)=>{
		console.log(balanceSH)
	})
