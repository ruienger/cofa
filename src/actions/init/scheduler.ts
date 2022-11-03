import Scheduler from "src/core/scheduler";
import clone_repo from "./processes/clone_repo";
import clone_repo_prompt from "./processes/clone_repo_prompt";
import init_prompt from "./processes/init_prompt";
import npm_init from "./processes/npm_init";
import npm_init_prompt from "./processes/npm_init_prompt";

export default new Scheduler([
  clone_repo_prompt,
  clone_repo,
  init_prompt,
  npm_init,
  npm_init_prompt,
])