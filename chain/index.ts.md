# chain/index.ts
# Learn ChainSafe's eth2.0


## Docs :memo:
- chain/index.ts    
>chain client
>
    export class BeaconChain extends EventEmitter {
        public chain: string;
        private db: DB;
        private eth1: Eth1Notifier;
        private _latestBlock: BeaconBlock;

>>BeaconChain is an event of js
can on and emit

>constructor
>
        public constructor(opts, {db, eth1}) {
        }

        public async start(): Promise<void> {
        }

        public async stop(): Promise<void> {}


>construct genesis block
    
        public async initializeChain(genesisTime: number64, genesisDeposits: Deposit[], genesisEth1Data: Eth1Data): Promise<void> {
        }
> Per-block processing

        public async receiveBlock(block: BeaconBlock): Promise<BeaconState> {
          
          // ...
          // process skipped slots
          for (let i = state.slot; i < block.slot - 1; i++) {
            state = this.runStateTransition(headRoot, null, state);
          }
          // ...
          
        }
>> We can skip some slot
>> view skipped slot as null block
>> We don't do anything for null block, as [executeStateTransition() in chain/stateTransition/index.ts]()

>TODO
>
        /**
         * Update the chain head using LMD GHOST
         */
        public async applyForkChoiceRule(): Promise<void> {
          const state = await this.db.getState();
          const currentJustifiedRoot = getBlockRoot(state, getEpochStartSlot(state.justifiedEpoch));
          // const currentJustifiedRoot = state.currentJustifiedRoot;
          const currentJustifiedBlock = await this.db.getBlock(currentJustifiedRoot);
          const currentJustifiedState = await this.db.getJustifiedState();
          const currentRoot = await this.db.getChainHeadRoot()
          // TODO use lmd ghost to compute best block
          const block = this._latestBlock;
          if (!currentRoot.equals(hashTreeRoot(block, BeaconBlock))) {
            await this.db.setChainHead(state, block)
          }
        }
>>  see [Casper FFG paper](https://arxiv.org/abs/1710.09437) 
and [Beacon chain Casper FFG mini-spec](https://ethresear.ch/t/beacon-chain-casper-ffg-rpj-mini-spec/2760) to understand justified and finalized checkpoint
TODO should read db

        /**
         * Ensure that the block is compliant with block processing validity conditions
         */
        public async isValidBlock(state: BeaconState, block: BeaconBlock): Promise<boolean> {
          // The parent block with root block.previous_block_root has been processed and accepted.
          
          // An Ethereum 1.0 block pointed to by the state.latest_eth1_data.block_hash has been processed and accepted.
          // TODO: implement
        }
>> parent block and referenced eth 1.0 block should be processed

        private runStateTransition(headRoot: bytes32, block: BeaconBlock | null, state: BeaconState): BeaconState {
          const newState = executeStateTransition(state, block, headRoot);
          // TODO any extra processing, eg post epoch
          // TODO update ffg checkpoints (requires updated state object)
          return newState;
        }
      }
      
>> TODO check what need to do after executeStateTransition()    


---

## Article Archive :books:
- [Reddit English](http://bit.ly/2mOJPu7)

---

## Community :beers:
- [GitHub](http://bit.ly/2AWWzkD)
