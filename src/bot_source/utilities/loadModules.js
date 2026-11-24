import { existsSync, readdirSync } from "fs";
import { resolve, basename } from "path";
import { log, logSave } from "../../utils/eventlogs.js";

export async function loadModulesFromFolder(sourceDir) {
    log("Loading modules...");
    var modules = {};

    async function walk(dir) {
        if (!existsSync(dir)) {
            log("Skipping missing directory: " + dir);
            return;
        }

        var items = readdirSync(dir, { withFileTypes: true });

        for (var item of items) {
            var itemPath = resolve(dir, item.name);

            if (item.isDirectory()) {
                await walk(itemPath); // recurse asynchronously
            } else if (item.isFile() && item.name.endsWith('.js')) {
                var moduleName = basename(item.name, '.js');
                try {
                    var imported = await import(`file://${itemPath}`);
                    modules[moduleName] = imported.default || imported;
                } catch (err) {
                    log("- Failed to load module at path: " + itemPath + " with error:\n" + err);
                    logSave();
                }
            }
        }
    }

    await walk(sourceDir);

    return modules;
}