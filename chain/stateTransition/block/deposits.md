#### deposits.ts
>
	export function processDeposit(state: BeaconState, deposit: Deposit): void
>>
	assert(verifyMerkleBranch(
		hash(serialize(deposit.data, DepositData)), 
		deposit.proof,
		DEPOSIT_CONTRACT_TREE_DEPTH,
		deposit.index,
		state.latestEth1Data.depositRoot,
	  ));
>> Check `deposit` is in merkle tree
>> We have recorded new depositRoot in some slot  
	
	assert(deposit.index === state.depositIndex);
  	state.depositIndex += 1;
>> Deposits must be processed in order
>>
	const pubkey = deposit.data.pubkey;
	  const amount = deposit.data.amount;
	  const validatorIndex = state.validatorRegistry.findIndex((v) => v.pubkey.equals(pubkey));
	  if (validatorIndex === -1) {
		if (!bls.verify(
		  pubkey,
		  signingRoot(deposit.data, DepositData),
		  deposit.data.signature,
		  getDomain(state, Domain.DEPOSIT),
		)) {
		  return state;
		}
		const validator: Validator = {
		  pubkey,
		  withdrawalCredentials: deposit.data.withdrawalCredentials,
		  activationEligibilityEpoch: FAR_FUTURE_EPOCH,
		  activationEpoch: FAR_FUTURE_EPOCH,
		  exitEpoch: FAR_FUTURE_EPOCH,
		  withdrawableEpoch: FAR_FUTURE_EPOCH,
		  slashed: false,
		  effectiveBalance: bnMin(
			amount.sub(amount.mod(EFFECTIVE_BALANCE_INCREMENT)),
			MAX_EFFECTIVE_BALANCE
		  ),
		};
		state.validatorRegistry.push(validator);
		state.balances.push(amount);
>>or
>>
	if (validatorIndex === -1) {
		if (!bls.verify(//...)) {
		  return state;
		}
		const validator: Validator = {//...	};
		state.validatorRegistry.push(validator);
		state.balances.push(amount);
		
>> New validator, check signature and add he
>>Initialize all critical time
>> They are `FAR_FUTURE_EPOCH`, Infinity
>> `effectiveBalance`
>>>`EFFECTIVE_BALANCE_INCREMENT`=1 eth
>>>`MAX_EFFECTIVE_BALANCE`=32 eth
>>>`amount.sub(amount.mod(EFFECTIVE_BALANCE_INCREMENT))`
>>>>ignore fraction

>>>`bnMin()`
>>>>Balance can't exceed `MAX_EFFECTIVE_BALANCE`

>>
	state.validatorRegistry.push(validator);
	state.balances.push(amount);
>>Add validator, sepreate amount
>
	else {
		increaseBalance(state, validatorIndex, amount);
	  }
>>If the validator has deposited, increase his balance by amount
>>Fresh validator can't owns much than 32 eth, but we don't check balance in `increaseBalance()` 
>>after `increaseBalance()` may exceed 32 eth (Is this the property we want? )

>>Notice that, we don't process deposit logic or record any deposit on eth 1.0
>>eth 1.0 only has a single contract recorded information of deposit root
>>deposit logic ( balance, who deposit twice ) are process on eth 2.0 

> Relay deposits decided by depositCount in state or not

	export default function processDeposits(state: BeaconState, block: BeaconBlock): void {
	  // Verify that outstanding deposits are processed up to the maximum number of deposits
	  assert(block.body.deposits.length ===
		Math.min(MAX_DEPOSITS, state.latestEth1Data.depositCount - state.depositIndex));
	  for (const deposit of block.body.deposits) {
		processDeposit(state, deposit);
	  }

>> The assertion force proposer relay all new deposits or no deposit
>> Illustrate by figure below :

					{		A	}	B	{		C		}	D		{		E		}
	depositCount(state) 		0	0	...	0	10	10	10	...		10	25		100		100		108
	deposits.length(block)		0	0	...	0	10	0	0	...		0	15		16		16		16
	depositIndex(state)		0	0	...	0	0~9,10	10	10	...		10	10~25,26	26~41,42	43~58,59	59~74,75
									     \__( after process deposit 9 )										 
>>If `depositCount` doesn't update, proposer doesn't relay any deposit
>>`deposits.length`=0 always passes the assertion no matter `depositIndex` of state
>>As { A }, { C }

>>If `depositCount` increases, ( b/c open votes of eth1datat in this slot ), we must process all new deposits in this slot
>>We can't remain desposits for next slot, any other deposits.length causes the assertion fail
>>As { B }, { D }

>>We process at most `MAX_DEPOSITS`=16 in 1 slot
>>If `depositCount` increase rapidly, we must process 16 deposits in slot
>>Remain deposits processed by follow slots 
>>As { E }

>> eth1.0 goes faster:
>>> { E }
>>> Or we open votes faster than relay deposits

>> eth2.0 goes faster:
>>> { A }, { C }
>>> No more deposits we can relay


 






