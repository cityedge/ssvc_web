# SSVC Web 1.0.0

音楽と背景を、ひとつの映像に。画像・音源・字幕・スペアナ動画をブラウザ内で合成し、MP4に書き出します。

このパッケージは **GitHub Pagesへの公開とWindowsでのローカル実行の両方**に対応します。アプリはビルド済みです。同じファイルをそのまま使用でき、npm installやビルドは不要です。

## Windowsで起動

1. ZIPをフォルダーにすべて展開します。ZIPの中から直接起動しないでください。
2. [Node.js](https://nodejs.org/) **22.12以降**をインストールします（導入済みなら不要）。Node.js本体は同梱していません。
3. **start-web.bat** をダブルクリックすると、ローカルサーバーが起動し、ChromeまたはEdgeで http://127.0.0.1:5178/ を開きます。
4. 終了はアプリ右下の「ローカルサーバーを停止」、または起動ウィンドウで **Q → Enter / Ctrl+C**。ブラウザのタブを閉じるだけではサーバーは終了しません。

index.htmlの直接ダブルクリックではなく、起動バッチを使用してください。Python・FFmpeg・npmパッケージは不要です。標準フォント使用時はインターネット接続なしでも動作します。Google Fontsを選ぶ場合は通信が必要です。別のポートを使う場合は `start-web.bat --port 5188` のように指定できます。

## GitHubユーザーページへ公開

1. GitHubに `<ユーザー名>.github.io` リポジトリを用意します。例えばユーザー名がcityedgeなら `cityedge.github.io` です。
2. 公開用ブランチ（例: **gh-pages**）を作り、ZIPを展開した**中身をすべて**ブランチのルートへ追加・コミットします。`index.html` がルートに置かれる形です。起動バッチやscriptsフォルダーも、そのまま含めて構いません。ZIPファイルだけをアップロードしても動作しません。
3. リポジトリの **Settings → Pages → Deploy from a branch** で、公開用ブランチと **/ (root)** を選び、Saveします。main以外のブランチでも公開できます。
4. デプロイ完了後、`https://<ユーザー名>.github.io/` をPC版ChromeまたはEdgeで開きます。閲覧する人のNode.js導入やサーバー起動は不要です。

既存のユーザーサイトがある場合は、既存index.htmlを置き換えず、公開中ブランチの `ssvc/` などのサブフォルダーへこのパッケージの中身を置いてください。その場合のURLは `https://<ユーザー名>.github.io/ssvc/` です。既存サイトの公開ブランチを変更する必要はありません。通常のプロジェクトリポジトリのPagesにも同じ内容を置けます。

`.nojekyll` を含め、ファイル構成を維持してください。GitHubの画面で一括アップロードできない場合は、分割して追加するかGitHub Desktop等を使います。`.ssvc-package` は配布生成時の識別用です。公開サイトではローカルサーバー停止ボタンは表示されません。

GitHub公式: [ユーザーサイトの作成](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)、[公開元ブランチの設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 基本操作

背景画像と音源を選び、必要に応じてSRT字幕やスペアナ動画を開きます。見た目と出力設定を調整し、「MP4を書き出す」で保存します。スライドショーや最大2枚のアイコン画像にも対応します。日英表示を切り替えられます。

素材はサーバーに送信されず、処理は利用者のPC内で行います。プロジェクトJSONには素材本体を含まないため、再開時は素材をまとめて選択して再接続してください。プリセットはブラウザ・サイトごとに保存されます。ローカルと公開サイト間で移す場合はプリセットJSONを書き出して取り込みます。

詳しい操作は **[詳細ユーザーガイド（全20章）](MANUAL.html)** を参照してください。初めての動画作成、各設定の意味、SRT・タイムシートの記入例、保存・再開、トラブル対処を説明しています。展開後の `MANUAL.html` は直接ダブルクリックで読めます。目次から移動でき、Ctrl＋Fで検索、Ctrl＋Pで印刷できます。日本語のガイドです。

## Package contents / English

This is one prebuilt package for both GitHub Pages and Windows local use.

- **Windows:** Install Node.js 22.12+ separately, extract the entire ZIP, then double-click `start-web.bat`. No npm install or build is needed. Desktop Chrome or Edge opens automatically. Stop using the app button or Q + Enter / Ctrl+C in the launcher window.
- **GitHub Pages:** Upload all extracted contents to the root of a publishing branch (for example `gh-pages`) in `<username>.github.io`. Select that branch and `/ (root)` in Settings → Pages → Deploy from a branch. Open the resulting HTTPS URL. Visitors need no Node.js. For an existing site, preserve its homepage and place the package in a subfolder such as `ssvc/` on its current publishing branch.
- Keep `index.html`, `assets/`, `favicon.svg`, `licenses/`, `.nojekyll`, `scripts/` and `start-web.bat` together. Local launcher files can stay in the published repository. They are not executed by GitHub Pages.
- Media stays on your device. Google Fonts require internet access; browser standard fonts work offline. Project JSON stores settings and media references, not the media itself. Re-select the media when reopening a project.
- `LICENSE` covers SSVC; `third-party-notices.txt` and `licenses/` contain dependency notices.
- Open `MANUAL.html` for the detailed Japanese user guide, including step-by-step workflows, setting explanations and troubleshooting. It works offline and includes a print layout.
