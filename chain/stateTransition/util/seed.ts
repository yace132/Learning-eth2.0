#### seed.ts
> Choose seed for each epoch
>> 
    export function generateSeed(state: BeaconState, epoch: Epoch): bytes32 {
      return hash(Buffer.concat([
        getRandaoMix(state, epoch + LATEST_RANDAO_MIXES_LENGTH - MIN_SEED_LOOKAHEAD),
        getActiveIndexRoot(state, epoch),
        intToBytes(epoch, 32),
      ]));
    }

1. get the random number of last epoch ( latest random number )
>
    export function getRandaoMix(state: BeaconState, epoch: Epoch): bytes32 {
    return state.latestRandaoMixes[epoch % LATEST_RANDAO_MIXES_LENGTH];
    }
>> get random number from latest generated random numbers recorded in block ( state ) 
>> 
>> everyone can do it, just read blockchain data

>>argument `state, epoch + LATEST_RANDAO_MIXES_LENGTH - MIN_SEED_LOOKAHEAD` for last epoch random number
>>
>>Notice that 1 random number for 1 epoch
>>But this random number update for each slot
>>
2. get activate validators of current epoch 
>
    export function getActiveIndexRoot(state: BeaconState, epoch: Epoch): bytes32 {
      return state.latestActiveIndexRoots[epoch % LATEST_ACTIVE_INDEX_ROOTS_LENGTH];
    }
    
>>`LATEST_ACTIVE_INDEX_ROOTS_LENGTH` ~ 8000

>>`latestActiveIndexRoots`
>>> for latest 8000 epoches, records their activate validators (just record the root)
3. convert epoch to 32 bytes
4. hash(1,2,3)
>
>How random seed of this epoch?
>> Even randaoMix and activate set repeat, different epoch has different seed.
>> 
>>  Even we predict the activate set of some future epoch E
>>  We can't know E's seed until E's last slot ends.
>>> If we compute earlier, the randaoMix value is not the same after the E's last slot, the earlier seed is different and invalid. 
>>> Or the seed changes depends on when do we generate seed 
>>> Or epoch seed changes for each slot

>> differnt activate set produce diffrent seed (is this helpful?)