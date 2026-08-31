"use client";
import { useState } from "react";
import { CopyButton } from "./CopyButton";

type RotateCopy = { rotateError: string; newCode: string; copyNow: string; rotating: string; rotate: string };

export function RotateJoinCode({ teamId, copy }: { teamId: string; copy: RotateCopy }) {
  const [code,setCode]=useState<string|null>(null);const [error,setError]=useState<string|null>(null);const [busy,setBusy]=useState(false);
  async function rotate(){setBusy(true);setError(null);const res=await fetch("/api/teams/rotate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({teamId})});const data=await res.json();setBusy(false);if(!res.ok)return setError(data.error||copy.rotateError);setCode(data.joinCode)}
  return <div>{code?<div className="result ok join-code-inline">{copy.newCode} <strong>{code}</strong> <CopyButton text={code} /></div>:<button className="btn ghost" onClick={rotate} disabled={busy}>{busy?copy.rotating:copy.rotate}</button>}{error&&<small className="inline-error">{error}</small>}</div>;
}
