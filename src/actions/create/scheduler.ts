import Scheduler from "src/core/scheduler";
import webFramePrompt from "./processes/webFramePrompt.ts";
import projectTypePrompt from "./processes/projectTypePrompt";
import libFramePromptTsCopy from "./processes/libFramePrompt";
import cloneRepo from "./processes/cloneRepo.js";

export default new Scheduler([webFramePrompt, projectTypePrompt, libFramePromptTsCopy, cloneRepo]);
