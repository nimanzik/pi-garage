# Development

Use Node.js 26 and npm. Run commands from the repository root.

## Setup and checks

```sh
npm ci
npm test
npm run typecheck
```

Load Auto Title without saving it to Pi's settings:

```sh
pi -e ./extensions/pi-auto-title
```

Load Prompt Mode without saving it to Pi's settings:

```sh
pi -e ./extensions/pi-prompt-mode
```

## Adding an extension

Keep each extension in `extensions/<name>/` with its own package manifest,
README, changelog, tests, and MIT license copy. Declare the extension entry point
in the manifest's `pi.extensions` array. Pi loads TypeScript directly, so no
compiled output directory is needed.

Use the root lockfile rather than adding lockfiles inside individual workspaces.
The root package is private and is not published.

## Releases (for maintainers)

Packages have independent versions. In the release PR, bump only the extension
being released and add a changelog entry under a heading such as `## 0.1.2`.
Update the root lockfile and run the checks:

```sh
npm install --package-lock-only --ignore-scripts
npm ci
npm test
npm run typecheck
```

Pack the selected workspace and inspect its contents. For example:

```sh
npm pack --dry-run --workspace @nimanzik/pi-auto-title
npm pack --workspace @nimanzik/pi-auto-title --pack-destination /tmp
```

The package should include only its TypeScript source, README, changelog,
manifest, and license. Tests and internal agent documentation are excluded.

Extract the tarball and run `pi -e` with the path to its `package` directory.
For Auto Title, use a configured provider to check that it summarises a review
prompt and preserves a manual title. For Prompt Mode, check `/mode`, `Alt+O`,
`Alt+N`, mode editing, and prompt history.

### Publish from GitHub Actions

After merging the PR, open **Actions → Release → Run workflow** on `main`
and select the extension.

1. Use `dry-run` to run the checks and inspect the tarball in the run's
   artifacts. It does not contact npm to stage a release.
2. Use `stage` to run the checks and submit the tarball from that run to npm.
   The run summary shows the package, version, and source commit.
3. Before approving the release, check the tag `<extension>-v<version>` on
   GitHub. If it already exists and points to a different commit than the one
   in the stage run summary, stop. Do not move the tag.
4. Review the package in [Staged Packages][staged] on npm and approve it with
   two-factor authentication. Approval makes the version public.
5. Download and extract the artifact from the `stage` run, not the `dry-run`
   run. Compare its tarball with the public npm tarball. For example, from
   the directory with the extracted tarball:

   ```sh
   curl -fL -o public.tgz \
     https://registry.npmjs.org/@nimanzik/pi-auto-title/-/pi-auto-title-0.1.2.tgz &&
     cmp public.tgz nimanzik-pi-auto-title-0.1.2.tgz
   ```

   Follow the provenance link on the package version's npm page and check
   that the source commit matches the stage run summary. If either check
   fails, stop. If npm is still processing the release, wait rather than
   stage it again.
6. Tag the verified commit as `<extension>-v<version>` if the tag does not
   already exist. Create a GitHub Release from that tag using the changelog.

### Set up npm Trusted Publishing

In the GitHub repository settings, create an `npm-release` environment and
restrict deployments to the `main` branch.

Add a [Trusted Publisher][trusted] for GitHub Actions separately for
`@nimanzik/pi-auto-title` and `@nimanzik/pi-prompt-mode`. Use `nimanzik` as the
owner, `pi-garage` as the repository, `release.yml` as the workflow filename,
and `npm-release` as the environment. Leave **Allow npm publish** and
**Allow npm dist-tag** unchecked. No npm token needs to be saved in GitHub.

Set up each publisher just before its first release. Complete staging and npm
approval within two days of setup. A dry run does not validate the publisher.
If the configuration expires, delete it in the package settings and add it
again.

[staged]: https://www.npmjs.com/settings/nimanzik/staged-packages

[trusted]: https://docs.npmjs.com/trusted-publishers/
