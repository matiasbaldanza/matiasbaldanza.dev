/**
 * Marks this browser tab as having entered through an unlisted pitch, so
 * matiasbaldanza.dev can offer a way back from its homepage.
 *
 * Drop-in: copy this file, render <UnlistedEntryMarker /> once in the root
 * layout. No dependencies, no props needed.
 *
 * Contract with the parent site — it reads one sessionStorage key:
 *   key:   "unlisted-entry"
 *   value: {"label": string, "href": string}
 *
 * `label` is substituted into the sentence "I believe you came here through
 * ___", so it has to fit that grammar. `href` is resolved on
 * matiasbaldanza.dev, so it must be apex-relative ("/basement"), never this
 * project's own host.
 *
 * Session-scoped by design: dies with the tab, no cookies, no identifiers,
 * nothing sent anywhere. Don't make it more persistent.
 *
 * Only works when the app is reached through matiasbaldanza.dev/basement —
 * sessionStorage is per-origin, so on a *.vercel.app host this writes to
 * storage the parent site can't read. That's expected, and it's the first
 * thing to check if the banner doesn't appear.
 *
 * Works in both routers, and as .jsx if you delete the `type Props` block
 * and the `: Props` annotation.
 */

type Props = {
  label?: string;
  href?: string;
};

export function UnlistedEntryMarker({
  label = "my basement.studio pitch",
  href = "/basement",
}: Props = {}) {
  // Written as an inline script rather than a useEffect so it runs before
  // hydration and needs no "use client" — this is a server component.
  const payload = JSON.stringify(JSON.stringify({ label, href }));

  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `try{sessionStorage.setItem("unlisted-entry",${payload})}catch{}`,
      }}
    />
  );
}

export default UnlistedEntryMarker;
