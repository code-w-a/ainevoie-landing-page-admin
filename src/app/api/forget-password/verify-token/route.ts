import { NextResponse } from "next/server";

export const POST = async () => {
  return NextResponse.json(
    { error: "Endpoint indisponibil." },
    { status: 501 }
  );
};
