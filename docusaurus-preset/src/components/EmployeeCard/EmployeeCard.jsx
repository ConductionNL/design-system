/**
 * <EmployeeCard /> + <TeamGrid />
 *
 * Person-card pattern from preview/components/employee-cards.html.
 * Three variants:
 *   - compact: row card for dense team grids (avatar + name + role + links)
 *   - photo:   centered photo card for /about (large hex avatar + bio + links)
 *   - detail:  spotlight card with the cobalt-50 corner-hex for /about/team
 *
 * The avatar is a 44x50 (compact) or 72x83 (large) pointy-top hex.
 * Pass `initials` for an avatar-fill, or `photo` for a photographed person.
 *
 * Usage:
 *
 *   <TeamGrid columns={3}>
 *     <EmployeeCard
 *       variant="compact"
 *       name="Ruben van der Linde"
 *       role="Founder · Architect"
 *       initials="RV"
 *       avatarColor="var(--c-blue-cobalt)"
 *       links={[
 *         {label: 'email', href: 'mailto:ruben@conduction.nl', icon: 'mail'},
 *         {label: 'github', href: 'https://github.com/...', icon: 'github'},
 *       ]}
 *     />
 *   </TeamGrid>
 *
 * Links.
 *   Every contact is one entry in `links`, and the entry decides all
 *   three things: `href` is the destination, `icon` picks the glyph
 *   from the ICONS map below, and `label` is the accessible name (it
 *   is what a screen reader announces, and what renders verbatim if
 *   the icon name is unknown). There is no separate email or phone
 *   prop — an address is a `mailto:` href with icon 'mail', a number
 *   is a `tel:` href with icon 'phone'. Adding a new network means
 *   adding one entry to ICONS; nothing else in the component knows
 *   which networks exist.
 *
 *   Supported icons and the href each expects:
 *     mail      mailto:naam@conduction.nl
 *     phone     tel:+31612345678        (E.164, no spaces)
 *     github    https://github.com/<user>
 *     linkedin  https://www.linkedin.com/in/<slug>/
 *     bluesky   https://bsky.app/profile/<handle>
 *     mastodon  https://<instance>/@<handle>
 *
 *   An http(s) href opens in a new tab, the same rule FeatureGrid,
 *   ContactCta, ExternalAppShelf, Footer and Navbar already follow: a
 *   contact link leaves the site for someone's profile, and sending a
 *   reader away mid-page loses where they were. `mailto:` and `tel:`
 *   are excluded — they hand off to another application, so a _blank
 *   on them opens a tab that never paints and stays behind empty.
 */

import React from 'react';
import styles from './EmployeeCard.module.css';

/* `rel` travels with every `target="_blank"`: without it the opened page
   receives a `window.opener` handle back into ours. Modern browsers imply
   `noopener` for _blank, but the preset states it rather than relying on
   that, and `noreferrer` additionally withholds the Referer header. */
const externalProps = (href = '') =>
  /^https?:\/\//.test(href) ? {target: '_blank', rel: 'noopener noreferrer'} : {};

const ICONS = {
  /* Font Awesome Free 6, the SVG set — CC BY 4.0, attributed in the
     preset README. Each is a single solid path at Font Awesome's own
     viewBox, pasted rather than imported: six glyphs do not justify a
     runtime dependency on the icon packages for every site that
     installs this preset. If the set ever grows past a dozen, swap to
     @fortawesome/free-solid-svg-icons and free-brands-svg-icons.

     Sourced from FortAwesome/Font-Awesome 6.x:
       mail      svgs/solid/envelope.svg
       phone     svgs/solid/phone.svg
       github    svgs/brands/github.svg
       linkedin  svgs/brands/linkedin.svg */
  mail: <svg viewBox="0 0 512 512"><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM0 176L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-208L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"/></svg>,
  github: <svg viewBox="0 0 496 512" data-mark="true"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></svg>,
  linkedin: <svg viewBox="0 0 448 512" data-mark="true"><path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"/></svg>,
  phone: <svg viewBox="0 0 512 512"><path d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z"/></svg>,
  /* The two fediverse marks are trademarks, not icons we may draw, so
     they are the official artwork at its original geometry rather than
     a redraw normalised to the 24x24 box the other four use.

       bluesky   bsky.social/about/brand-assets/butterfly/
                 bluesky_media_kit_logo_transparent_4.svg (568x501)
       mastodon  joinmastodon.org/logos/logo-black.svg and
                 logo-white.svg (74x79) — the brand page, not the
                 in-app logo-symbol-icon.svg in the code repo, which
                 is a different and simpler drawing

     Every glyph in this map is a solid path now, so filling rather
     than stroking is the default; what these two carry instead is
     data-mark, the do-not-recolour lock.

     Four of the six glyphs carry data-mark, in two tiers. Bluesky
     permits the butterfly as a profile link with no permission needed
     (Trademark Policy 4.1) but forbids recolouring outside the black
     and white variants; Mastodon's policy says not to change or modify
     the marks at all. GitHub allows white, black, and in few cases grey
     or green; LinkedIn allows three colour options only. Black and
     white are what all four permit, so all four render black on the
     light chip and white on the cobalt hover chip instead of inheriting
     currentColor.

     mail and phone stay off the lock: they are Font Awesome utility
     glyphs under CC BY 4.0, nobody's trademark, and free to take the
     brand colour if the row is ever restyled.

     Mastodon ships black and white as two separately drawn files —
     the coordinates differ, they are not one path with two fills the
     way Bluesky's are. So both are embedded and the stylesheet shows
     whichever suits the ground, rather than filling one of them the
     other colour. At 16px nobody could tell; the point is that each
     variant is their file, used in the situation they drew it for.

     Keep the paths byte-identical to the source files. Rescaling or
     re-tracing them is the thing both policies prohibit. */
  bluesky: <svg viewBox="0 0 568 501" data-mark="true"><path d="M123.121 33.6637C188.241 82.5526 258.281 181.681 284 234.873C309.719 181.681 379.759 82.5526 444.879 33.6637C491.866 -1.61183 568 -28.9064 568 57.9464C568 75.2916 558.055 203.659 552.222 224.501C531.947 296.954 458.067 315.434 392.347 304.249C507.222 323.8 536.444 388.56 473.333 453.32C353.473 576.312 301.061 422.461 287.631 383.039C285.169 375.812 284.017 372.431 284 375.306C283.983 372.431 282.831 375.812 280.369 383.039C266.939 422.461 214.527 576.312 94.6667 453.32C31.5556 388.56 60.7778 323.8 175.653 304.249C109.933 315.434 36.0535 296.954 15.7778 224.501C9.94525 203.659 0 75.2916 0 57.9464C0 -28.9064 76.1345 -1.61183 123.121 33.6637Z"/></svg>,
  mastodon: (
    <svg viewBox="0 0 74 79" data-mark="true">
      <path className={styles.markOnLight} d="M73.7014 17.4323C72.5616 9.05152 65.1774 2.4469 56.424 1.1671C54.9472 0.950843 49.3518 0.163818 36.3901 0.163818H36.2933C23.3281 0.163818 20.5465 0.950843 19.0697 1.1671C10.56 2.41145 2.78877 8.34604 0.903306 16.826C-0.00357854 21.0022 -0.100361 25.6322 0.068112 29.8793C0.308275 35.9699 0.354874 42.0498 0.91406 48.1156C1.30064 52.1448 1.97502 56.1419 2.93215 60.0769C4.72441 67.3445 11.9795 73.3925 19.0876 75.86C26.6979 78.4332 34.8821 78.8603 42.724 77.0937C43.5866 76.8952 44.4398 76.6647 45.2833 76.4024C47.1867 75.8033 49.4199 75.1332 51.0616 73.9562C51.0841 73.9397 51.1026 73.9184 51.1156 73.8938C51.1286 73.8693 51.1359 73.8421 51.1368 73.8144V67.9366C51.1364 67.9107 51.1302 67.8852 51.1186 67.862C51.1069 67.8388 51.0902 67.8184 51.0695 67.8025C51.0489 67.7865 51.0249 67.7753 50.9994 67.7696C50.9738 67.764 50.9473 67.7641 50.9218 67.7699C45.8976 68.9569 40.7491 69.5519 35.5836 69.5425C26.694 69.5425 24.3031 65.3699 23.6184 63.6327C23.0681 62.1314 22.7186 60.5654 22.5789 58.9744C22.5775 58.9477 22.5825 58.921 22.5934 58.8965C22.6043 58.8721 22.621 58.8505 22.6419 58.8336C22.6629 58.8167 22.6876 58.8049 22.714 58.7992C22.7404 58.7934 22.7678 58.794 22.794 58.8007C27.7345 59.9796 32.799 60.5746 37.8813 60.5733C39.1036 60.5733 40.3223 60.5733 41.5447 60.5414C46.6562 60.3996 52.0437 60.1408 57.0728 59.1694C57.1983 59.1446 57.3237 59.1233 57.4313 59.0914C65.3638 57.5847 72.9128 52.8555 73.6799 40.8799C73.7086 40.4084 73.7803 35.9415 73.7803 35.4523C73.7839 33.7896 74.3216 23.6576 73.7014 17.4323ZM61.4925 47.3144H53.1514V27.107C53.1514 22.8528 51.3591 20.6832 47.7136 20.6832C43.7061 20.6832 41.6988 23.2499 41.6988 28.3194V39.3803H33.4078V28.3194C33.4078 23.2499 31.3969 20.6832 27.3894 20.6832C23.7654 20.6832 21.9552 22.8528 21.9516 27.107V47.3144H13.6176V26.4937C13.6176 22.2395 14.7157 18.8598 16.9118 16.3545C19.1772 13.8552 22.1488 12.5719 25.8373 12.5719C30.1064 12.5719 33.3325 14.1955 35.4832 17.4394L37.5587 20.8853L39.6377 17.4394C41.7884 14.1955 45.0145 12.5719 49.2765 12.5719C52.9614 12.5719 55.9329 13.8552 58.2055 16.3545C60.4017 18.8574 61.4997 22.2371 61.4997 26.4937L61.4925 47.3144Z"/>
      <path className={styles.markOnDark} d="M73.7014 17.9592C72.5616 9.62034 65.1774 3.04876 56.424 1.77536C54.9472 1.56019 49.3517 0.7771 36.3901 0.7771H36.2933C23.3281 0.7771 20.5465 1.56019 19.0697 1.77536C10.56 3.01348 2.78877 8.91838 0.903306 17.356C-0.00357857 21.5113 -0.100361 26.1181 0.068112 30.3439C0.308275 36.404 0.354874 42.4535 0.91406 48.489C1.30064 52.498 1.97502 56.4751 2.93215 60.3905C4.72441 67.6217 11.9795 73.6395 19.0876 76.0945C26.6979 78.6548 34.8821 79.0799 42.724 77.3221C43.5866 77.1245 44.4398 76.8953 45.2833 76.6342C47.1867 76.0381 49.4199 75.3714 51.0616 74.2003C51.0841 74.1839 51.1026 74.1627 51.1156 74.1382C51.1286 74.1138 51.1359 74.0868 51.1368 74.0592V68.2108C51.1364 68.185 51.1302 68.1596 51.1185 68.1365C51.1069 68.1134 51.0902 68.0932 51.0695 68.0773C51.0489 68.0614 51.0249 68.0503 50.9994 68.0447C50.9738 68.0391 50.9473 68.0392 50.9218 68.045C45.8976 69.226 40.7491 69.818 35.5836 69.8087C26.694 69.8087 24.3031 65.6569 23.6184 63.9285C23.0681 62.4347 22.7186 60.8764 22.5789 59.2934C22.5775 59.2669 22.5825 59.2403 22.5934 59.216C22.6043 59.1916 22.621 59.1702 22.6419 59.1533C22.6629 59.1365 22.6876 59.1248 22.714 59.1191C22.7404 59.1134 22.7678 59.1139 22.794 59.1206C27.7345 60.2936 32.799 60.8856 37.8813 60.8843C39.1036 60.8843 40.3223 60.8843 41.5447 60.8526C46.6562 60.7115 52.0437 60.454 57.0728 59.4874C57.1983 59.4628 57.3237 59.4416 57.4313 59.4098C65.3638 57.9107 72.9128 53.2051 73.6799 41.2895C73.7086 40.8204 73.7803 36.3758 73.7803 35.889C73.7839 34.2347 74.3216 24.1533 73.7014 17.9592ZM61.4925 47.6918H53.1514V27.5855C53.1514 23.3526 51.3591 21.1938 47.7136 21.1938C43.7061 21.1938 41.6988 23.7476 41.6988 28.7919V39.7974H33.4078V28.7919C33.4078 23.7476 31.3969 21.1938 27.3894 21.1938C23.7654 21.1938 21.9552 23.3526 21.9516 27.5855V47.6918H13.6176V26.9752C13.6176 22.7423 14.7157 19.3795 16.9118 16.8868C19.1772 14.4 22.1488 13.1231 25.8373 13.1231C30.1064 13.1231 33.3325 14.7386 35.4832 17.9662L37.5587 21.3949L39.6377 17.9662C41.7884 14.7386 45.0145 13.1231 49.2765 13.1231C52.9614 13.1231 55.9329 14.4 58.2055 16.8868C60.4017 19.3772 61.4997 22.74 61.4997 26.9752L61.4925 47.6918Z"/>
    </svg>
  ),
};

export function TeamGrid({columns = 3, children, className}) {
  const composed = [styles.grid, styles['cols-' + columns], className].filter(Boolean).join(' ');
  return <div className={composed}>{children}</div>;
}

export default function EmployeeCard({
  variant = 'compact',
  name,
  role,
  initials,
  photo,
  avatarColor,
  bio,
  apps = [],
  links = [],
  className,
}) {
  if (variant === 'photo') {
    return (
      <div className={[styles.cardPhoto, className].filter(Boolean).join(' ')}>
        <div className={styles.avatarLarge} style={!photo ? {background: avatarColor || 'var(--c-blue-cobalt)'} : undefined}>
          {photo ? <img src={photo} alt={name} /> : initials}
        </div>
        {name && <div className={styles.name}>{name}</div>}
        {role && <div className={styles.role}>{role}</div>}
        {bio && <p className={styles.bio}>{bio}</p>}
        {links.length > 0 && (
          <div className={styles.contacts}>
            {links.map((l, i) => (
              <a key={i} href={l.href} aria-label={l.label} {...externalProps(l.href)}>{ICONS[l.icon] || l.label}</a>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className={[styles.cardDetail, className].filter(Boolean).join(' ')}>
        <div className={styles.avatarLarge} style={!photo ? {background: avatarColor || 'var(--c-blue-cobalt)'} : undefined}>
          {photo ? <img src={photo} alt={name} /> : initials}
        </div>
        <div>
          {name && <div className={styles.name}>{name}</div>}
          {role && <div className={styles.role}>{role}</div>}
        </div>
        {bio && <p className={styles.bio}>{bio}</p>}
        {apps.length > 0 && (
          <div>
            <div className={styles.appsLabel}>Apps I work on</div>
            <div className={styles.appsList}>
              {apps.map((a, i) => <span key={i} className={styles.appPill}>{a}</span>)}
            </div>
          </div>
        )}
        {links.length > 0 && (
          <div className={styles.contactsInline}>
            {links.map((l, i) => (
              <a key={i} href={l.href} {...externalProps(l.href)}>{ICONS[l.icon]}{l.label}</a>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* default: compact */
  const Tag = links.length > 0 && links[0].href ? 'a' : 'div';
  return (
    <Tag
      href={Tag === 'a' ? links[0].href : undefined}
      {...(Tag === 'a' ? externalProps(links[0].href) : {})}
      className={[styles.cardCompact, className].filter(Boolean).join(' ')}
    >
      <div className={styles.avatar} style={!photo ? {background: avatarColor || 'var(--c-blue-cobalt)'} : undefined}>
        {photo ? <img src={photo} alt={name} /> : initials}
      </div>
      <div className={styles.info}>
        {name && <div className={styles.name}>{name}</div>}
        {role && <div className={styles.role}>{role}</div>}
      </div>
      {links.length > 0 && (
        <div className={styles.linksRow}>
          {links.map((l, i) => (
            <a key={i} href={l.href} aria-label={l.label} {...externalProps(l.href)}>{ICONS[l.icon]}</a>
          ))}
        </div>
      )}
    </Tag>
  );
}
