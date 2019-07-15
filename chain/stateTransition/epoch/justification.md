#### justification.ts
> Execute result of voting ( attestation ) 
>
	export function processJustificationAndFinalization(state: BeaconState): void
>>
	if(getCurrentEpoch(state) <= GENESIS_EPOCH + 1) {
    	return;
  	}
>> Skip epoch 0, 1

>>> We process attestation of epoch i and (i-1) in epoch i
>>> Then we justify those attestations in start of epoch (i+1)
>>> So, in epoch 0, no attestation exists, no justification
>>> in epoch 1, we can only justify epoch -1, 0
>>> We don't need to justify them, so return in epoch 0, 1  

	state.previousJustifiedEpoch = oldCurrentJustifiedEpoch;
	state.previousJustifiedRoot = state.currentJustifiedRoot;
>>
	state.justificationBitfield = state.justificationBitfield.shln(1)
    .mod((new BN(2)).pow(new BN(64)));
>>`justificationBitfield` 64 bit, each for 1 of recent 64 epochs
>>Shift 1 bit left to leave room for current epoch

>
	const previousEpochMatchingTargetBalance =
		getAttestingBalance(state, getMatchingTargetAttestations(state, previousEpoch));
	  if (previousEpochMatchingTargetBalance.muln(3).gte(totalActiveBalance.muln(2))) {
		state.currentJustifiedEpoch = previousEpoch;
		state.currentJustifiedRoot =  getBlockRoot(state, state.currentJustifiedEpoch);
		state.justificationBitfield = state.justificationBitfield.or(new BN(2));
	  }

	const currentEpochMatchingTargetBalance =
		getAttestingBalance(state, getMatchingTargetAttestations(state, currentEpoch));
	  if (currentEpochMatchingTargetBalance.muln(3).gte(totalActiveBalance.muln(2))) {
		state.currentJustifiedEpoch = currentEpoch;
		state.currentJustifiedRoot = getBlockRoot(state, state.currentJustifiedEpoch);
		state.justificationBitfield = state.justificationBitfield.or(new BN(1));
	  }
	  
>> Justify different types of votes and set corresponding bit in `justificationBitfield`
>> If no such type votes, # of votes is 0, if condition fail
>> 


|    epoch #    |         P        |      C     |     justify previous     |     justify current    |
|:-------------:|:----------------:|:----------:|:------------------------:|:----------------------:|
|      0,1      |        -1        |      0     |                          |                        |
|       2       |         0        |   1 or 2   |         -1 --> 1         |         0 --> 2        |
|       3       |      1 or 2      |   2 or 3   |          0 --> 2         |      1 or 2 --> 3      |
|       4       | (4-1)-1 or (4-1) |  4-1 or 4  | (4-2)-1 or (4-2) --> 4-1 | (4-1)-1 or (4-1) --> 4 |
|       5       | (5-1)-1 or (5-1) |  5-1 or 5  | (5-2)-1 or (5-2) --> 5-1 | (5-1)-1 or (5-1) --> 5 |
|  . . .  . . . |                  |            |                          |                        |
|      i-1      |    i-2 or i-1    | i-2 or i-1 |    i-4 or i-3 --> i-2    |   i-3 or i-2 --> i-1   |
|       i       | (i-1)-1 or (i-1) |  i-1 or i  | (i-2)-1 or (i-2) --> i-1 | (i-1)-1 or (i-1) --> i |
|               |      C(i-1)      |  i-1 or i  |      P(i-1) --> i-1      |      C(i-1) --> i      |
|               |                  |            |      C(i-2) --> i-1      |                        |

>>

	// Process finalizations
	  // The 2nd/3rd/4th most recent epochs are all justified, the 2nd using the 4th as source
	  if (bitfield.shrn(1).modn(8) ===
		0b111 && oldPreviousJustifiedEpoch === currentEpoch - 3) {
		state.finalizedEpoch = oldPreviousJustifiedEpoch;
		state.finalizedRoot = getBlockRoot(state, state.finalizedEpoch);
	  }
	  // The 2nd/3rd most recent epochs are both justified, the 2nd using the 3rd as source
	  if (bitfield.shrn(1).modn(4) ===
		0b11 && oldPreviousJustifiedEpoch === currentEpoch - 2) {
		state.finalizedEpoch = oldPreviousJustifiedEpoch;
		state.finalizedRoot = getBlockRoot(state, state.finalizedEpoch);
	  }
	  // The 1st/2nd/3rd most recent epochs are all justified, the 1st using the 3rd as source
	  if (bitfield.shrn(0).modn(8) ===
		0b111 && oldCurrentJustifiedEpoch === currentEpoch - 2) {
		state.finalizedEpoch = oldCurrentJustifiedEpoch;
		state.finalizedRoot = getBlockRoot(state, state.finalizedEpoch);
	  }
	  // The 1st/2nd most recent epochs are both justified, the 1st using the 2nd as source
	  if (bitfield.shrn(0).modn(4) ===
		0b11 && oldCurrentJustifiedEpoch === currentEpoch - 1) {
		state.finalizedEpoch = oldCurrentJustifiedEpoch;
		state.finalizedRoot = getBlockRoot(state, state.finalizedEpoch);
	  }
	  
>> Finalize a epoch
1. Who can be finalized in current block?
>> Who jusitify his child can be finalized
>> We use `oldPreviousJustifiedEpoch` or `oldCurrentJustifiedEpoch` justify epochs in current block 
>> They may be finalized
>> Thus, the 1 of 4 cases finalize possible `oldPreviousJustifiedEpoch` or `oldCurrentJustifiedEpoch`

2. Who is `oldPreviousJustifiedEpoch`? Who is `oldCurrentJustifiedEpoch`?
>>They are determined by recent justifications
>>We can judge by `bitfield`

3. Justification in this block also helps we distinguish `oldPreviousJustifiedEpoch` and `oldCurrentJustifiedEpoch`

4. We jusitify at most 1 epoch in 1 epoch
We finalize at most 1 epoch in 1 epoch

5. Justifications & finalizations are related to recent 4 epochs ( current to current -3 ) 
