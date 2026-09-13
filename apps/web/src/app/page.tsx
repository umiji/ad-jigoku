/**
 * TASK-001 のプレースホルダ。LP は TASK-033 以降、ゲームは TASK-014 以降。
 * 中身は仮でも、暗い基盤とトークン（DESIGN.md §4,5,6）の上に置く。
 */
export default function HomePage() {
  return (
    <main className="container-gutter mx-auto max-w-content py-96">
      <p className="text-ad-meta uppercase text-text-secondary">TASK-001 PLACEHOLDER</p>
      <h1 className="text-h1">ようこそ、広告地獄へ。</h1>
      <p className="text-body text-text-secondary mt-24">
        このサイトでは、広告を閉じないと先に進めません。
      </p>
      <p className="text-ad-legal text-text-secondary mt-16">
        ※ LP は TASK-033 以降、ゲームは TASK-014 以降で実装。トークン一覧は /dev/tokens。
      </p>
    </main>
  )
}
