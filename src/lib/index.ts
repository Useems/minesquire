import { Bot } from "..";

import Chat, { ChatEvents } from "./plugins/chat";
import Inventory, { InventoryEvents } from "./plugins/inventory";

export interface Plugins extends Chat, Inventory {};
export interface PluginsEvents extends ChatEvents, InventoryEvents {};
export type Plugin = (bot: Bot, options?: {[key: string]: any}) => void
