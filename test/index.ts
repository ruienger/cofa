import test from "node:test";
import assert from "node:assert";
import { generateStandardOutput } from "src/utils";

const rootdir = "test";
// const intervalrepo = `${rootdir}/itvrepo.zip`;
// const publicrepo = `${rootdir}/pbcrepo.zip`;
// const privaterepo = `${rootdir}/prvrepo.zip`;

test("test cofa core feature: repo clone", async (t) => {
  const intervalRepo = generateStandardOutput(["master"]);
  const publicRepo = generateStandardOutput({
    type: "github",
    host: "https://github.com",
    username: "ruienger",
    repo: "repo-templates",
    branch: "master",
  });
  const privateRepo = generateStandardOutput({
    type: "gitlab",
    host: "http://172.21.3.132",
    username: "na.zhang",
    repo: "one_map_standard_vue",
    branch: "master",
  });
  await t.test("generate strandard repo infomation", async () => {
    assert(intervalRepo, "generate from cofa prompts");
    assert(publicRepo, "generate from given info(public host)");
    assert(privateRepo, "generate from given info(private host)");
  });
  // await t.test("clone from interval repo", async () => {
  //   await clone(intervalRepo, intervalrepo);
  // });
  // await t.test("clone from public repo", async () => {
  //   await clone(publicRepo, publicrepo);
  // });
  // await t.test("clone from private repo", async () => {
  //   await clone(privateRepo, privaterepo);
  // });
});
