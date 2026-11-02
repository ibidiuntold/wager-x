export const calculatePotentialWin = (amount: string, wager: any, participants: any, selectedOption: any): number => {
    if (!amount || !wager || !participants || !selectedOption) return 0;

    const betAmountNum = Number(amount);
    if (isNaN(betAmountNum) || betAmountNum <= 0) return 0;

    const totalPool = wager.totalPool ?? 0;

    const totalOnSelectedOption = participants
      .filter(p => p.optionSelected === selectedOption && typeof p.wagerAmount === 'number')
      .reduce((sum, p) => sum + p.wagerAmount, 0) + betAmountNum;

    if (totalOnSelectedOption === 0) return 0;

    const totalPoolWithNewBet = totalPool + betAmountNum;

    console.log({ betAmountNum, totalPool, totalOnSelectedOption, totalPoolWithNewBet });

    return (betAmountNum / totalOnSelectedOption) * totalPoolWithNewBet;
  };