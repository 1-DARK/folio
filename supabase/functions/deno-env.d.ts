// The parts of the Deno runtime these functions use, so the editor knows
// them. Supabase runs the functions on Deno, where `Deno` exists for real;
// this file is only for type-checking and isn't deployed.
// (With the Deno VS Code extension enabled for this folder, delete this file.)

declare const Deno: {
  serve(handler: (req: Request) => Response | Promise<Response>): void;
  env: { get(key: string): string | undefined };
};
