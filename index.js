const axios = require("axios");
const FormData = require("form-data");

let API_PROTO = "https://";
let API_MAIN = "api.bitails.io";
let API_TESTNET = "test-api.bitails.io";

class Explorer {
    /**
     * Bitails API Wrapper
     * @param {string} network Selected network: main or test
     * @param {object} opts timeout, userAgent, apiKey and enableCache
     */
    constructor(network = 'main', opts = {}) {
        this._network = (network === 'main' || network === 'mainnet' || network === 'livenet') ? 'main' : (network === 'test' || network === 'testnet') ? 'test' : 'stn';
        this._timeout = opts.timeout || 30000;
        this._userAgent = opts.userAgent || opts._userAgent;
        this._apiKey = opts.apiKey;
        this._enableCache = (opts.enableCache === undefined) ? true : !!opts.enableCache;
        this.url = opts.url ? opts.url : this._network === "main" ? `${API_PROTO}${API_MAIN}` : `${API_PROTO}${API_TESTNET}`;
        this._init();
    }

    _init() {
        // Enhance the original axios adapter with throttle and cache enhancer
        const headers = {
            'Cache-Control': 'no-cache'
        };

        if (this._userAgent) {
            headers['User-Agent'] = this._userAgent;
        }

        this._httpClient = axios.create({
            baseURL: `${this.url}/`,
            timeout: this._timeout,
            headers
        });

        return this;
    }

    _parseResponse(response) {
        return response.data;
    }

    _parseError(error) {
        if (error.response) {
            throw new Error(JSON.stringify(error.response.data));
        } else if (error.request) {
            throw new Error(error.message);
        } else {
            throw error;
        }
    }

    _get(command, params = {}) {
        const options = {
            params
        }

        return this._httpClient.get(command, options).then(this._parseResponse).catch(this._parseError);
    }

    _post(command, data) {
        const options = {
            headers: {
                'Content-Type': 'application/json'
            }
        }

        return this._httpClient.post(command, data, options).then((resp) => { return this._parseResponse(resp); }).catch(this._parseError);
    }

    _postBinary(command, data, url = "") {
        const form_data = new FormData();
        form_data.append("raw", new Blob([data]), { type: 'raw' });

        if (url === "") {
            url = `${this.url}/tx/broadcast/multipart`;
        }

        return axios({
            method: 'post',
            url: url,
            headers: { 'Content-Type': 'multipart/form-data' },
            data: form_data,
            timeout: 100000,
            maxBodyLength: Infinity
        }).then(this._parseResponse).catch(this._parseError);
    }

    /**
     * Get api status
     * Simple endpoint to show API server is up and running
     * https://docs.bitails.io/#get-api-status
     */
    status() {
        return this._get('network/stats').then(result => result);
    }

    /**
     * Get blockhain info
     * This endpoint retrieves various state info of the chain for the selected network.
     * https://docs.bitails.io/#chain-info
     */
    chainInfo() {
        return this._get('network/info');
    }

    /**
     * Get by hash
     * This endpoint retrieves block details with given hash.
     * https://docs.bitails.io/#get-block-by-hash
     * @param {string} hash The hash of the block to retrieve
     */
    blockHash(hash) {
        return this._get(`block/${hash}`);
    }

    /**
     * Get by height
     * This endpoint retrieves block details with given block height.
     * https://docs.bitails.io/#get-by-height
     * @param {number} height The height of the block to retrieve
     */
    blockHeight(height) {
        return this._get(`block/height/${height}`);
    }

    /**
     * Get latest block
     * This endpoint retrieves latest block header details.
     * https://docs.bitails.io/#get-latest-block
     */
    blockLatest() {
        return this._get(`block/latest`);
    }

    /**
     * Get block pages
     * If the block has more that 1000 transactions the page URIs will be provided in the pages element when getting a block by hash or height.
     * https://docs.bitails.io/#get-block-pages
     * @param {string} hash The hash of the block to retrieve
     * @param {number} page Page number
     */
    blockList(height, opt = { skip: 0, limit: 100, sort: 'height', order: 'asc' }) {
        const { skip, limit, sort, order } = { ...{ skip: 0, limit: 100, sort: 'height', order: 'asc' }, ...opt };
        return this._get(`block/list?fromHeight=${height}&skip=${skip}&limit=${limit}&sort=${sort}&order=${order}`);
    }


    /**
     * Returns the transactions of a block based on the index
     */
    blockTransactions(hash, opt = { from: 0, limit: 10 }) {
        return this._get(`block/${hash}/transactions?from=${opt.from}&limit=${opt.limit}`);
    }

    /**
     * Returns the tags stats of blocks
     *  Perdiod: 1h || 24h || 7d
     */
    blockTagHistogram(period = '24h', opt = {}) {
        return this._get(`block/stats/tag/${period}/histogramblock?fromTime=${opt.from}&toTime=${opt.to}`);
    }

    /**
     * Returns the mining stats of blocks
     *  Perdiod: 1h || 24h || 7d 
     */
    blockMiningHistogram(period = '24h', opt = {}) {
        return this._get(`block/stats/mining/${period}/histogramblock?fromTime=${opt.from}&toTime=${opt.to}`);
    }

    /**
     * Returns the props of blocks in given period
     *    *  Perdiod: 1h || 24h || 7d
     */
    blockPropsHistogram(period = '24h', opt = {}) {
        return this._get(`block/stats/props/${period}/histogramblock?fromTime=${opt.from}&toTime=${opt.to}`);
    }

    /**
     * Get by tx hash
     * This endpoint retrieves transaction details with given transaction hash.
     * In the response body, if any output hex size, exceeds 100KB then data is truncated
     * NOTICE:A separate endpoint get raw transaction output data can be used to fetch full hex data
     * https://docs.bitails.io/#get-by-tx-hash
     * @param {string} hash The hash/txId of the transaction to retrieve
     */
    txHash(hash) {
        return this._get(`tx/${hash}`);
    }

    /**
     * Download raw transactions
     * https://docs.bitails.io/#download-transaction
     * @param {string} hash The hash/txId of the transaction to retrieve
     */
    downloadTx(hash) {
        return this._get(`download/tx/${hash}`, { responseType: 'arraybuffer' });
    }

    /**
     * Download specific transaction output
     * https://docs.bitails.io/#download-transaction
     * @param {string} hash The hash/txId of the transaction to retrieve
     * @param {integer} index The index of the output to retrieve
     */
    downloadTxOut(hash, index) {
        return this._get(`download/tx/${hash}/output/${index}`);
    }

    /**
     * Broadcast transaction
     * Broadcast transaction using this endpoint. Get txid in response or error msg from node with header content-type: text/plain.
     * https://docs.bitails.io/#broadcast-transaction
     * @param {string} txhex Raw transaction data in hex
     */
    broadcast(txhex) {
        return this._post('tx/broadcast', {
            raw: txhex
        });
    }

    broadcastBinary(txBuf) {
        return this._postBinary('tx/broadcast/multipart', txBuf);
    }

    /**
     * Get raw transaction output data
     * Get raw transaction vout data in hex
     * https://docs.bitails.io/#get-raw-transaction-output-data
     * @param {string} hash The hash/txId of the transaction
     * @param {number} outputIndex Output index
     */
    getOutputData(hash, outputIndex) {
        return this._get(`tx/${hash}/output/${outputIndex}`);
    }


    getOutputsData(hash, fromIndex, toIndex) {
        return this._get(`tx/${hash}/outputs/${fromIndex}/${toIndex}`);
    }

    /**
     * Get merkle proof
     * This endpoint returns merkle branch to a confirmed transaction
     * https://docs.bitails.io/#get-merkle-proof
     * @param {string} hash The hash/txId of the transaction
     */
    merkleProof(hash) {
        return this._get(`tx/${hash}/proof`);
    }


    /**
     * Get mempool info
     * This endpoint retrieves various info about the node's mempool for the selected network.
     * https://docs.bitails.io/#get-mempool-info
     */
    mempoolInfo() {
        return this._get(`mempool`);
    }


    /**
     * Get mempool transactions
     * This endpoint retrieve list of transaction ids from the node's mempool for the selected network.
     * https://docs.bitails.io/#get-mempool-transactions
     * 
     */
    mempoolTxs() {
        return this._get(`mempool/transactions`);
    }


    /**
     * Get address info
     * This endpoint retrieves various address info.
     * @param {string} address 
     */
    addressInfo(address) {
        return this._get(`address/${address}/details`);
    }

    /**
     * Get balance
     * This endpoint retrieves confirmed and unconfirmed address balance.
     * @param {string} address 
     */
    balance(address) {
        return this._get(`address/${address}/balance`);
    }

    /**
     * Get history
     * This endpoint retrieves confirmed and unconfirmed address transactions.
     * https://docs.bitails.io/#get-history
     * @param {string} address 
     */
    history(address, pgkey = "", limit = 100, pagination = true, pagesize = 10, page = 1) {
        let pgkeyParam = "";
        if (pgkey != "") { pgkeyParam = `pgkey=${pgkey}&`; } else { pgkeyParam = ""; }

        return this._get(`address/${address}/history?${pgkeyParam}limit=${limit}`);
    }

    /**
     * Get unspent transactions
     * This endpoint retrieves ordered list of UTXOs.
     * https://docs.bitails.io/#get-unspent-transactions
     * @param {string} address 
     */
    utxos(address, from = 0, limit = 100) {
        return this._get(`address/${address}/unspent?from=${from}&limit=${limit}`);
    }

    /**
     * Get balance of  scriptHash
     * This endpoint retrieves balace if ScriptHash
     * https://docs.bitails.io/#get-balance-of-scripthash
     * @param {string} scriptHash Script hash: Sha256 hash of the binary bytes of the locking script (ScriptPubKey), expressed as a hexadecimal string.
     */
    balanceScriptHash(scriptHash) {
        return this._get(`scripthash/${scriptHash}/balance`);
    }
    
    /**
     * Get scriptHash history
     * This endpoint retrieves confirmed and unconfirmed script transactions.
     * https://docs.bitails.io/#get-history-of-scripthash
     * @param {string} scriptHash Script hash: Sha256 hash of the binary bytes of the locking script (ScriptPubKey), expressed as a hexadecimal string.
     */
    historyByScriptHash(scriptHash, pgkey = "", limit = 100, pagination = true, pagesize = 100, page = 1) {
        let pgkeyParam = "";
        if (pgkey != "") { pgkeyParam = `pgkey=${pgkey}&`; } else { pgkeyParam = ""; }
        return this._get(`scripthash/${scriptHash}/history?${pgkeyParam}limit=${limit}`);
    }

    /**
     * Get scriptHash information
     * This endpoint retrieves information abut ScriptHash
     * https://docs.bitails.io/#get-details-of-scripthash
     * @param {string} scriptHash Script hash: Sha256 hash of the binary bytes of the locking script (ScriptPubKey), expressed as a hexadecimal string.
     */
    detailsScriptHash(scriptHash) {
        return this._get(`scripthash/${scriptHash}/details`);
    }

    /**
     * Get scriptHash unspent transactions
     * This endpoint retrieves ordered list of UTXOs.
     * https://docs.bitails.io/#get-script-unspent-transactions
     * @param {string} scriptHash Script hash: Sha256 hash of the binary bytes of the locking script (ScriptPubKey), expressed as a hexadecimal string.
     */
    utxosByScriptHash(scriptHash, from = 0, limit = 100) {
        return this._get(`scripthash/${scriptHash}/unspent?from=${from}&limit=${limit}`);
    }

    /**
     * Get txid details links
     * This endpoint retrieves transactions including the search parameter.
     * https://docs.bitails.io/#Search
     * type: all || ops || tx || block || scripthash || address
     * @param {string} 
     */
    search(q, opts = { type: 'ops', from: 0, limit: 10 }) {
        return this._get(`search?type=${opts.type}&q={${q}}&from=${opts.from}&limit=${opts.limit}`);
    }
}

module.exports = Explorer;