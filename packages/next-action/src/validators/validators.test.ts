import { z } from "zod"
import { createServerActionProvider } from "../server";
import * as v from "valibot";
import $zod from "./zod";
import $valibot from "./valibot";

describe("Validate with custom validators", () => {
    const client = createServerActionProvider();

    test("Validate with zod", async () => {
        const schema = z.object({
            num: z.number(),
            text: z.string(),
            bool: z.boolean(),
            date: z.date()
        });

        const action = client($zod(schema), ({ input }) => {
            return Promise.resolve(input);
        })

        await expect(action({
            num: 69,
            text: "Bitzø",
            bool: true,
            date: new Date(2060, 7, 20)
        })).resolves.toStrictEqual({
            num: 69,
            text: "Bitzø",
            bool: true,
            date: new Date(2060, 7, 20)
        })
    })

    test("Validate with valibot", async () => {
        const schema = v.object({
            num: v.number(),
            text: v.string(),
            bool: v.boolean(),
            date: v.date()
        });

        const action = client($valibot(schema), ({ input }) => {
            return Promise.resolve(input);
        })

        await expect(action({
            num: 69,
            text: "Bitzø",
            bool: true,
            date: new Date(2060, 7, 20)
        })).resolves.toStrictEqual({
            num: 69,
            text: "Bitzø",
            bool: true,
            date: new Date(2060, 7, 20)
        })
    })
})