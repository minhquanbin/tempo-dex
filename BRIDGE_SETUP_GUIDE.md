# 🌉 Tempo ↔️ Sepolia Bridge Setup Guide

## ✅ Bước 1: Cài đặt dependencies

```bash
npm install viem wagmi
```

## ✅ Bước 2: Copy các files

Đã tạo các files sau:
- `constants/ccip.ts` - CCIP addresses & config
- `hooks/useBridge.ts` - Bridge logic hook
- `components/Bridge/BridgeInterface.tsx` - Main UI
- `components/Bridge/ChainSelector.tsx` - Chain selector
- `components/Bridge/BridgeQuote.tsx` - Fee display
- `wagmi.config.ts` (updated) - Added Sepolia

## ✅ Bước 3: Get testnet tokens

### 3.1 Get LINK tokens (để trả CCIP fees)

**Tempo Testnet LINK:**
- Faucet: https://faucets.chain.link/tempo-testnet
- Address: `0x384C8843411f725e800E625d5d1B659256D629dF`

**Sepolia LINK:**
- Faucet: https://faucets.chain.link/sepolia
- Address: `0x779877A7B0D9E8603169DdbD7836e478b4624789`

### 3.2 Get CCIP-BnM tokens (test token)

**Tempo Testnet CCIP-BnM:**
- Address: `0x9Af873f951c444d37B27B440ae53AB63CE58E5e5`
- Faucet: https://faucets.chain.link/tempo-testnet

**Sepolia CCIP-BnM:**
- Address: `0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05`
- Faucet: https://faucets.chain.link/sepolia

## ✅ Bước 4: Test bridge flow

### 4.1 Bridge Tempo → Sepolia

1. **Connect wallet** to Tempo Testnet
2. **Enter amount** of CCIP-BnM to bridge
3. **Click "Approve Token"** (approve CCIP Router)
4. **Wait for approval** confirmation
5. **Click "Bridge Tokens"** (execute bridge)
6. **Pay CCIP fee** in LINK or native TEMPO
7. **Wait ~2-5 minutes** for cross-chain transfer

### 4.2 Track your bridge transaction

Visit CCIP Explorer:
- https://ccip.chain.link

Enter your transaction hash để xem:
- Bridge status (pending/success)
- Source tx hash
- Destination tx hash
- Estimated arrival time

## ⚠️ Important Notes

### Token Support

✅ **CCIP-BnM** - Fully supported, recommended for testing
- Available on both Tempo & Sepolia
- Burn/Mint mechanism
- 18 decimals

❌ **AlphaUSD, BetaUSD, ThetaUSD** - Currently NOT bridgeable
- Only exist on Tempo Testnet
- Need CCIP integration first
- Contact Tempo team to enable

### Fee Payment Options

**Option 1: Pay with LINK** (Recommended)
- More predictable fees
- Need LINK balance on source chain
- Set `feeOption: CCIPFeeOption.LINK`

**Option 2: Pay with native token**
- Pay with TEMPO (on Tempo) or ETH (on Sepolia)
- Slightly higher fees
- Set `feeOption: CCIPFeeOption.NATIVE`

### Gas Requirements

- **Approval tx**: ~50,000 gas
- **Bridge tx**: ~200,000-300,000 gas
- **CCIP fee**: ~0.001-0.01 LINK (varies by message size)

## 🎯 Testing Checklist

- [ ] Install dependencies
- [ ] Copy all files to project
- [ ] Get LINK from faucets (both chains)
- [ ] Get CCIP-BnM from faucets (both chains)
- [ ] Connect wallet to Tempo Testnet
- [ ] Try bridge small amount (~1 CCIP-BnM)
- [ ] Approve token for CCIP Router
- [ ] Execute bridge transaction
- [ ] Track on CCIP Explorer
- [ ] Wait for arrival on Sepolia (~5 min)
- [ ] Verify balance on destination

## 🐛 Common Issues

### "Failed to estimate bridge fee"
- ✅ Check you're on the correct source chain
- ✅ Verify CCIP Router address is correct
- ✅ Ensure token has CCIP support

### "Insufficient LINK balance"
- ✅ Get more LINK from faucet
- ✅ Or switch to native fee payment

### "Transaction failed"
- ✅ Check token allowance
- ✅ Ensure sufficient gas
- ✅ Verify recipient address is valid

### "Bridge taking too long"
- ✅ Normal wait time: 2-10 minutes
- ✅ Check CCIP Explorer for status
- ✅ Verify source tx confirmed

## 📚 Resources

- **Chainlink CCIP Docs**: https://docs.chain.link/ccip
- **CCIP Explorer**: https://ccip.chain.link
- **Tempo Docs**: https://docs.tempo.xyz
- **Tempo Testnet Info**: https://docs.chain.link/ccip/directory/testnet/chain/tempo-testnet
- **Sepolia Testnet Info**: https://docs.chain.link/ccip/directory/testnet/chain/ethereum-sepolia

## 🚀 Next Steps

After successful testing:

1. **Add more tokens** - Contact Tempo team to enable AlphaUSD/BetaUSD/ThetaUSD
2. **Optimize UX** - Add transaction history, notifications
3. **Add more chains** - Base, Arbitrum, Optimism support
4. **Mainnet deployment** - Use mainnet CCIP addresses when ready

---

**Need help?** 
- Chainlink Discord: https://discord.gg/chainlink
- Tempo Discord: Check Tempo docs for invite