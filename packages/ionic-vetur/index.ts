import fs from "fs";
import path from "path";
import docs from "@ionic/docs";
import { paramCase } from "change-case";

const ignoredProps = ["component", "componentProps", "delegate"];
const ignoredTags = ["ion-router", "ion-route", "ion-route-redirect"];
const tags: Record<string, any> = {
  "ion-app": {
    description:
      "App is a container element for an Ionic application. There should only be one `<ion-app>` element per project. An app can have many Ionic components including menus, headers, content, and footers. The overlay components get appended to the `<ion-app>` when they are presented.",
  },
  "ion-page": {
    description: 'A shortcut to `<div class="ion-page">`',
  },
};
const attrs: Record<string, any> = {};

docs.components
  .filter((c) => !ignoredTags.includes(c.tag))
  .forEach((c) => {
    tags[c.tag] = {
      description: c.docs,
      attributes: c.props
        .filter((p) => !ignoredProps.includes(p.name))
        .map((p) => p.attr || paramCase(p.name)),
    };

    c.props
      .filter((p) => !ignoredProps.includes(p.name))
      .forEach((p) => {
        const options: string[] = [];
        p.values.forEach(({ value }) => value && options.push(value));

        attrs[`${c.tag}/${p.attr || paramCase(p.name)}`] = {
          type: p.type,
          description: p.docs,
          ...(options.length ? { options } : {}),
        };
      });

    c.events.forEach((e) => {
      attrs[`${c.tag}/${fixOverlayEventName(e.event)}`] = {
        type: "event",
        description: e.docs,
      };
    });
  });

if (!fs.existsSync(path.resolve(__dirname, "./dist"))) {
  fs.mkdirSync(path.resolve(__dirname, "./dist"));
}

writeOutput(tags, "tags");
writeOutput(attrs, "attributes");

function writeOutput(data: Record<string, unknown>, type: string) {
  fs.writeFile(
    path.resolve(__dirname, `./dist/${type}.json`),
    JSON.stringify(data, null, 2) + "\n",
    (err) => {
      if (err) {
        console.error(err);
      } else {
        console.info(`Generated vetur dist/${type}.json`);
      }
    },
  );
}

function fixOverlayEventName(event: string): string {
  const suffixes = ["WillPresent", "DidPresent", "WillDismiss", "DidDismiss"];
  for (const s of suffixes) {
    if (event.endsWith(s)) {
      return s.charAt(0).toLowerCase() + s.slice(1);
    }
  }
  return event;
}
