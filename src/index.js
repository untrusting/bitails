const Buffer = require("buffer")
const axios = require( "axios" );

/* const FormData = require("form-data");
const Blob = require("node-blob");
*/

const { cacheAdapterEnhancer, throttleAdapterEnhancer } = require( 'axios-extensions' )
let API_PROTO ="https://"
//let API_ROOT = "api.bitails.net"
let API_ROOT = "api.bsv.direct/e2"
let API_MAIN = "api.bsv.direct/e2"

let API_TESTNET = "api.bsv.direct/test/e2"

class Explorer {
  /**
   * Bitails API Wrapper
   * @param {string} network Selected network: main , test or TODO:stn
   * @param {object} opts timeout, userAgent, apiKey and enableCache
   */
  constructor ( network = 'main', opts = {} ) {
    this._network = ( network === 'main' || network === 'mainnet' || network === 'livenet' ) ? 'main' : ( network === 'test' || network === 'testnet' ) ? 'test' : 'stn'
    this._timeout = opts.timeout || 30000
    this._userAgent = opts.userAgent | opts._userAgent
    this._apiKey = opts.apiKey
    this._enableCache = ( opts.enableCache === undefined ) ? true : !!opts.enableCache

    this._init()
  }

  _init () {
    // enhance the original axios adapter with throttle and cache enhancer 
    const headers = {
      'Cache-Control': 'no-cache'
    }
    const throttleOpt = {}
    const cacheOpt = {
      enabledByDefault: this._enableCache
    }

    if ( this._userAgent ) {
      headers[ 'User-Agent' ] = this._userAgent
    }

    if ( this._apiKey ) {
      headers[ 'bitails-api-key' ] = this._apiKey
      throttleOpt[ 'threshold' ] = 0
    } else {
      //Up to 3 requests/sec.
      // https://docs.bitails.net/#rate-limits
      throttleOpt[ 'threshold' ] = 333 //(1000/3)
    }
    
    if (this._network=="test"){ API_ROOT = API_TESTNET; }else{ API_ROOT = API_MAIN;   }
    this._httpClient = axios.create( {
      baseURL: `${API_PROTO}${API_ROOT}/`,
      timeout: this._timeout,
      headers,
      adapter: throttleAdapterEnhancer( cacheAdapterEnhancer( axios.defaults.adapter, cacheOpt ), throttleOpt )
    } )


    return this
  }

  _parseResponse ( response ) {
    return response.data
  }

  _parseError ( error ) {
    if ( error.response ) {
      // server return error
      // console.warn( error.response.data )
      // console.warn( error.response.status )
      // console.warn( error.response.headers )
      throw new Error( JSON.stringify(error.response.data ) )
    } else if ( error.request ) {
      // console.warn( error.message )
      throw new Error( error.message )
    } else {
      // console.warn( 'Error', error )
      throw error
    }
  }

  _get ( command, params ) {
    // Create query with given parameters, if applicable
    params = params || {}

    const options = {
      params
    }
    return this._httpClient.get( command, options )
      .then( this._parseResponse )
      .catch( this._parseError )
  }

  _post ( command, data ) {
    const options = {
      headers: {
        'Content-Type': 'application/json'
      }
    }

    return this._httpClient.post( command, data, options )
      .then( this._parseResponse )
      .catch( this._parseError )
  }

  _postBinary ( command, data ) {

            const form_data = new FormData();
            // for browser
            form_data.append("raw", new Blob([ data ]),{type: 'raw'});

             return axios({
                method: 'post',
                url: `https://test-api.bitails.net/tx/broadcast/multipart`,
                headers: { 'Content-Type': 'multipart/form-data'},
                data: form_data,
                timeout: 100000,
                maxBodyLength: Infinity
            }).then( this._parseResponse )
            .catch( this._parseError );

                
  }
  /**
   * Get api status
   * Simple endpoint to show API server is up and running
   * https://docs.bitails.net/#get-api-status
   */
  status () {
    return this._get( 'network/stats' ).then( result => result )
  }


  /**
   * Get blockhain info
   * This endpoint retrieves various state info of the chain for the selected network.
   * https://docs.bitails.net/#chain-info
   */
  chainInfo () {
    return this._get( 'network/info' )
  }


  /**
   * Get Circulating Supply
   * This endpoint provides circulating supply of BSV.
   * https://docs.bitails.net/#get-circulating-supply
  circulatingsupply () {
    return this._get( 'circulatingsupply' )
  }
   */



  /**
   * Get by hash
   * This endpoint retrieves block details with given hash.
   * https://docs.bitails.net/#get-block-by-hash
   * @param {string} hash The hash of the block to retrieve
   */
  blockHash ( hash ) {
    return this._get( `block/${hash}` )
  }

  /**
   * Get by height
   * This endpoint retrieves block details with given block height.
   * https://docs.bitails.net/#get-by-height
   * @param {number} height The height of the block to retrieve
   */
  blockHeight ( height ) {
    return this._get( `block/height/${height}` )
  }


  /**
   * Get block pages
   * If the block has more that 1000 transactions the page URIs will be provided in the pages element when getting a block by hash or height.
   * https://docs.bitails.net/#get-block-pages
   * @param {string} hash The hash of the block to retrieve
   * @param {number} page Page number
   */
  blockList ( height, limit ) {
    return this._get( `block/list?fromHeight=${height}&limit=${limit}` )
  }

  /**
   * Get latest block
   * This endpoint retrieves latest block header details.
   * https://docs.bitails.net/#get-latest-block
   * @param {string} hash The hash of the block to retrieve
   */
  blockLatest ( hash ) {
    return this._get( `block/latest` )
  }

  /**
   * Get headers
   * This endpoint retrieves last 10 block headers.
   */
  blockTransactions ( hash ) {
    return this._get( `block/${hash}/transactions` )
  }


  /**
   * Get by tx hash
   * This endpoint retrieves transaction details with given transaction hash.
   * In the response body, if any output hex size, exceeds 100KB then data is truncated
   * NOTICE:A separate endpoint get raw transaction output data can be used to fetch full hex data
   * https://docs.bitails.net/#get-by-tx-hash
   * @param {string} hash The hash/txId of the transaction to retrieve
   */
  txHash ( hash ) {
    return this._get( `tx/${hash}` )
  }

  /**
   * Download raw transactions
   * https://docs.bitails.net/#download-transaction
   * @param {string} hash The hash/txId of the transaction to retrieve
   */
  downloadTx ( hash ) {
   
    return this._get( `download/tx/${hash}`, {responseType: 'arraybuffer'});
  }
  /**
   * Download specific transaction output
   * https://docs.bitails.net/#download-transaction
   * @param {string} hash The hash/txId of the transaction to retrieve
   * @param {integer} index The index of the output to retrieve
   */
  downloadTxOut ( hash, index ) {
    return this._get( `download/tx/${hash}/output/${index}` )
  }

  /**
   * Broadcast transaction
   * Broadcast transaction using this endpoint. Get txid in response or error msg from node with header content-type: text/plain.
   * https://docs.bitails.net/#broadcast-transaction
   * @param {string} txhex Raw transaction data in hex
   */
  broadcast ( txhex ) {
    return this._post( 'tx/broadcast', {
      raw: txhex
    } )
  }

  broadcastBinary ( txBuf ) {
    return this._postBinary( 'tx/broadcast/multipart', txBuf )
  }



  /**
   * Bulk transaction details
   * Fetch details for multiple transactions in single request
   * - Max 20 transactions per request
   * https://docs.bitails.net/#bulk-transaction-details
   * @param {Array} txidArray 

  bulkTxDetails ( txidArray ) {
    return this._post( `txs`, {
      txids: txidArray
    } )
  }
  */
   

  /**
   * Decode transaction
   * Decode raw transaction using this endpoint. Get json in response or error msg from node.
   * https://docs.bitails.net/#decode-transaction
   * @param {string} txhex Raw transaction data in hex
   
  decodeTx ( txhex ) {
    return this._post( 'tx/decode', {
      txhex
    } )
  }
*/


  /**
   * Download receipt
   * Download transaction receipt (PDF)
   * https://docs.bitails.net/#download-receipt
   * @param {string} hash The hash/txId of the transaction
  receiptPDF ( hash ) {
    return this._get( `https://${this._network}.Bitails.com/receipt/${hash}` )
  }
   */

  /**
   * Get raw transaction data
   * Get raw transaction data in hex
   * https://docs.bitails.net/#get-raw-transaction-data
   * @param {string} hash The hash/txId of the transaction
  getRawTxData ( hash ) {
    return this._get( `tx/${hash}/hex` )
  }
   */


  /**
   * Get raw transaction output data
   * Get raw transaction vout data in hex
   * https://docs.bitails.net/#get-raw-transaction-output-data
   * @param {string} hash The hash/txId of the transaction
   * @param {number} outputIndex Output index
   */
  getOutputData ( hash, outputIndex ) {
    return this._get( `tx/${hash}/output/${outputIndex}` )
  }


  getOutputsData ( hash, fromIndex, toIndex ) {
    return this._get( `tx/${hash}/outputs/${fromIndex}/${toIndex}` )
  }

  /**
   * Get merkle proof
   * This endpoint returns merkle branch to a confirmed transaction
   * https://docs.bitails.net/#get-merkle-proof
   * @param {string} hash The hash/txId of the transaction
   */
  merkleProof ( hash ) {
    return this._get( `tx/${hash}/proof` )
  }


  /**
   * Get mempool info
   * This endpoint retrieves various info about the node's mempool for the selected network.
   * https://docs.bitails.net/#get-mempool-info
   */
  mempoolInfo () {
    return this._get( `mempool` )
  }


  /**
   * Get mempool transactions
   * This endpoint retrieve list of transaction ids from the node's mempool for the selected network.
   * https://docs.bitails.net/#get-mempool-transactions
   * 
   */
  mempoolTxs () {
    return this._get( `mempool/transactions` )
  }


  /**
   * Get address info
   * This endpoint retrieves various address info.
   * @param {string} address 
   */
  addressInfo ( address ) {
    return this._get( `address/${address}/details` )
  }

  /**
   * Get balance
   * This endpoint retrieves confirmed and unconfirmed address balance.
   * @param {string} address 
   */
  balance ( address ) {
    return this._get( `address/${address}/balance` )
  }

  /**
   * Get history
   * This endpoint retrieves confirmed and unconfirmed address transactions.
   * https://docs.bitails.net/#get-history
   * @param {string} address 
   */
  history ( address, pgkey="", limit=100 ) {
    let pgkeyParam=""
        if (pgkey!=""){  pgkeyParam=`pgkey=${pgkey}&`; }else{  pgkeyParam="";  }

    return this._get( `address/${address}/history?${pgkeyParam}limit=${limit}` )
  }

  /**
   * Get unspent transactions
   * This endpoint retrieves ordered list of UTXOs.
   * https://docs.bitails.net/#get-unspent-transactions
   * @param {string} address 
   */
  utxos ( address, from=0, limit=100 ) {

    return this._get( `address/${address}/unspent?from=${from}&limit=${limit}` )
  }


  /**
   * Download statement
   * Download address statement (PDF)
   * https://docs.bitails.net/#download-statement
   * @param {string} address 
   
  statementPDF ( address ) {
    return this._get( `https://${this._network}.Bitails.com/statement/${address}` )
  }
*/
  /**
   * Get scriptHash information
   * This endpoint retrieves information abut ScriptHash
   * https://docs.bitails.net/#get-details-of-scripthash
   * @param {string} scriptHash Script hash: Sha256 hash of the binary bytes of the locking script (ScriptPubKey), expressed as a hexadecimal string.
   */
  detailsScriptHash ( scriptHash ) {
    return this._get( `scripthash/${scriptHash}/details` )
  }

  /**
   * Get balance of  scriptHash
   * This endpoint retrieves balace if ScriptHash
   * https://docs.bitails.net/#get-balance-of-scripthash
   * @param {string} scriptHash Script hash: Sha256 hash of the binary bytes of the locking script (ScriptPubKey), expressed as a hexadecimal string.
   */
  balanceScriptHash ( scriptHash ) {
    return this._get( `scripthash/${scriptHash}/balance` )
  }
  /**
   * Get scriptHash history
   * This endpoint retrieves confirmed and unconfirmed script transactions.
   * https://docs.bitails.net/#get-history-of-scripthash
   * @param {string} scriptHash Script hash: Sha256 hash of the binary bytes of the locking script (ScriptPubKey), expressed as a hexadecimal string.
   */
  historyByScriptHash ( scriptHash,pgkey="", limit=5000 ) {
    let pgkeyParam
    if (pgkey!=""){  pgkeyParam=`pgkey=${pgkey}&`; }else{  pgkeyParam="";  }

    return this._get( `scripthash/${scriptHash}/history?${pgkeyParam}limit=${limit}` )
  }

  /**
   * Get scriptHash unspent transactions
   * This endpoint retrieves ordered list of UTXOs.
   * https://docs.bitails.net/#get-script-unspent-transactions
   * @param {string} scriptHash Script hash: Sha256 hash of the binary bytes of the locking script (ScriptPubKey), expressed as a hexadecimal string.
   */
  utxosByScriptHash ( scriptHash ) {
    return this._get( `scripthash/${scriptHash}/unspent` )
  }


  /**
   * Fee quotes
   * This endpoint provides fee quotes from multiple transaction processors. Each quote also contains transaction processor specific txSubmissionUrl and txStatusUrl. These unique URLs can be used to submit transactions to the selected transaction processor and check the status of the submitted transaction.
   * https://docs.bitails.net/#merchant-api-beta
  feeQuotes () {
    return this._get( `https://api.whatsonchain.com/v1/bsv/main/mapi/feeQuotes` )
  }
   */

  /**
   * Submit transaction
   * Submit a transaction to a specific transaction processor using the txSubmissionUrl provided with each quote in the Fee quotes response.
   * https://docs.bitails.net/#submit-transaction
   * @param {string} providerId Unique providerId from the Fee quotes response
   * @param {string} rawtx Raw transaction data in hex
  submitTx ( providerId, rawtx ) {
    return this._post( `mapi/${providerId}/tx`, {
      rawtx
    } )
  }
   */


  /**
   * Transaction status
   * Get a transaction's status from a specific transaction processor using the txStatusUrl provided with each quote in Fee quotes response.
   * @param {string} providerId Unique providerId from the Fee quotes response
   * @param {string} hash The hash/txId of the transaction
  txStatus ( providerId, hash ) {
    return this._get( `mapi/${providerId}/tx/${hash}` )
  }
   */


  /**
   * Get txid details links
   * This endpoint retrieves transactions including the search parameter.
   * https://docs.bitails.net/#Search
   * @param {string} query 
   */
  search ( text ) {
    return this._post( `search?q=${text}`, {
      query
    } )
  }
}

module.exports = Explorer
