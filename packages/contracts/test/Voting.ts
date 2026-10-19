import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Voting (draft smoke test)", () => {
  async function deploy() {
    const verifier = await ethers.deployContract("MockVerifier");
    const voting = await ethers.deployContract("Voting", [
      await verifier.getAddress(),
      1n, // electionId
      3n, // candidateCount
    ]);
    return { voting };
  }

  it("deploys with zeroed tallies", async () => {
    const { voting } = await deploy();
    expect(await voting.candidateCount()).to.equal(3n);
    expect(await voting.electionId()).to.equal(1n);
    expect(await voting.getResults()).to.deep.equal([0n, 0n, 0n]);
    expect(await voting.isNullifierUsed(123n)).to.equal(false);
  });

  it("vote() is not implemented yet", async () => {
    const { voting } = await deploy();
    const zero2 = [0n, 0n] as const;
    await expect(
      voting.vote(zero2, [zero2, zero2], zero2, 0n, 1n, 0n),
    ).to.be.revertedWithCustomError(voting, "NotImplemented");
  });
});
