/**
 * Homepage for connext.conduction.nl.
 *
 * Demonstrates the brand chassis (cobalt hero) plus the diagram set
 * (cn-platform with the Nextcloud workspace + orbiting apps). Real
 * content will be authored in OpenCatalogi once the content plugin
 * lands; for now this is the brand sanity check.
 */
import React, { useEffect } from 'react';
import Layout from '@theme/Layout';
import useIsBrowser from '@docusaurus/useIsBrowser';

export default function Home() {
  const isBrowser = useIsBrowser();

  /* Register the custom elements on the client only;
     Node-side rendering does not need the JS module. */
  useEffect(() => {
    if (isBrowser) {
      import('@conduction/diagrams');
    }
  }, [isBrowser]);

  return (
    <Layout
      title="The open-source workspace stack"
      description="ConNext, the platform proposition for Conduction's app ecosystem on Nextcloud."
    >
      <div className="cn-hero">
        <h1>Make <span className="next-blue">Nextcloud</span> your workspace.</h1>
        <p>
          Con<span className="next-blue">Next</span> brings data, processes, AI, and integrations to your <span className="next-blue">Nextcloud</span>, turning a file-sync platform into your actual workplace. Free apps, optional support, no upgrade nags.
        </p>
      </div>

      <div className="cn-stage">
        <h2>The platform, in one diagram</h2>
        {isBrowser && (
          <cn-platform ground>
            <cn-hex-prism slot="apex" family="cobalt" size="lg">
              <span slot="kicker">WORKSPACE</span>
              Nextcloud
            </cn-hex-prism>

            <cn-hex-prism family="coral" size="md">
              <span slot="kicker">DATA</span>
              Catalogi
            </cn-hex-prism>
            <cn-hex-prism family="gold" size="md">
              <span slot="kicker">DATA</span>
              Register
            </cn-hex-prism>
            <cn-hex-prism family="lavender" size="md">
              <span slot="kicker">CONNECT</span>
              Connector
            </cn-hex-prism>
            <cn-hex-prism family="mint" size="md">
              <span slot="kicker">DOCS</span>
              DocuDesk
            </cn-hex-prism>
            <cn-hex-prism family="coral" size="md">
              <span slot="kicker">DATA</span>
              MyDash
            </cn-hex-prism>
            <cn-hex-prism family="lavender" size="md">
              <span slot="kicker">AI</span>
              OpenAI
            </cn-hex-prism>
            <span slot="caption">Six apps · one workspace · all open-source</span>
          </cn-platform>
        )}

        <h2>Two stacks, one design system</h2>
        <p>
          This site is built on <a href="https://github.com/ConductionNL/design-system">@conduction/docusaurus-preset</a>, which bundles the brand tokens, theme, and i18n config used across every Conduction subdomain. The diagram above is rendered with <a href="https://connext.conduction.nl/diagrams/cn-platform.html"><code>&lt;cn-platform&gt;</code></a> from the same kit, no per-site re-implementation.
        </p>

        <p style={{ marginTop: 'var(--space-6)' }}>
          <a className="button button--primary" href="/docs/intro">Read the docs &rarr;</a>
          &nbsp;
          <a className="button button--secondary" href="/blog">Updates</a>
        </p>
      </div>
    </Layout>
  );
}
