import { NextRequest, NextResponse } from 'next/server';

import { getPrivateBattle } from '@/src/shared/lib/api/internal';

type RouteContext = {
  params: Promise<{
    battleId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { battleId } = await context.params;
  const parsedBattleId = Number(battleId);

  if (!parsedBattleId) {
    return NextResponse.json({ detail: 'Invalid battle id' }, { status: 400 });
  }

  const battle = await getPrivateBattle(parsedBattleId);

  if (!battle) {
    return NextResponse.json({ detail: 'Battle not found' }, { status: 404 });
  }

  return NextResponse.json(battle);
}
