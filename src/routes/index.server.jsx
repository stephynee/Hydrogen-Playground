import {Suspense} from 'react';
import {
  CacheLong,
  gql,
  Seo,
  ShopifyAnalyticsConstants,
  useServerAnalytics,
  useLocalization,
  useShopQuery,
} from '@shopify/hydrogen';

import {MEDIA_FRAGMENT, PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import {getHeroPlaceholder} from '~/lib/placeholders';
import {FeaturedCollections, Hero} from '~/components';
import {Layout, ProductSwimlane} from '~/components/index.server';

export default function Homepage() {
  useServerAnalytics({
    shopify: {
      pageType: ShopifyAnalyticsConstants.pageType.home,
    },
  });

  return (
    <Layout>
      <Suspense>
        <SeoForHomepage />
      </Suspense>
      <Suspense>
        <HomepageContent />
      </Suspense>
    </Layout>
  );
}

function HomepageContent() {
  const {
    language: {isoCode: languageCode},
    country: {isoCode: countryCode},
  } = useLocalization();

  const {data} = useShopQuery({
    query: HOMEPAGE_CONTENT_QUERY,
    variables: {
      language: languageCode,
      country: countryCode,
    },
    preload: true,
  });

  const {featuredCollections, featuredProducts, homepageHero, secondaryHero, featuredProducts2} = data;

  console.log('featured products: ', featuredProducts);
  console.log('featured products: ', featuredProducts2)

  return (
    <>
      {homepageHero && (
        <Hero {...homepageHero} />
      )}
      <ProductSwimlane
        data={featuredProducts.products.nodes}
        title="Featured Products"
        divider="bottom"
      />
      {secondaryHero && <Hero {...secondaryHero} />}
      <FeaturedCollections
        data={featuredCollections.nodes}
        title="Collections"
      />
    </>
  );
}

function SeoForHomepage() {
  const {
    data: {
      shop: {name, description},
    },
  } = useShopQuery({
    query: HOMEPAGE_SEO_QUERY,
    cache: CacheLong(),
    preload: true,
  });

  return (
    <Seo
      type="homepage"
      data={{
        title: name,
        description,
        titleTemplate: '%s · Powered by Hydrogen',
      }}
    />
  );
}

/**
 * The homepage content query includes a request for custom metafields inside the alias
 * `heroBanners`. The template loads placeholder content if these metafields don't
 * exist. Define the following five custom metafields on your Shopify store to override placeholders:
 * - hero.title             Single line text
 * - hero.byline            Single line text
 * - hero.cta               Single line text
 * - hero.spread            File
 * - hero.spread_seconary   File
 *
 * @see https://help.shopify.com/manual/metafields/metafield-definitions/creating-custom-metafield-definitions
 * @see https://github.com/Shopify/hydrogen/discussions/1790
 */

const HOMEPAGE_CONTENT_QUERY = gql`
  ${MEDIA_FRAGMENT}
  ${PRODUCT_CARD_FRAGMENT}
  query homepage($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    heroBanners: collections(
      first: 3
      query: "collection_type:custom"
      sortKey: UPDATED_AT
    ) {
      nodes {
        id
        handle
        title
        descriptionHtml
        heading: metafield(namespace: "hero", key: "title") {
          value
        }
        byline: metafield(namespace: "hero", key: "byline") {
          value
        }
        cta: metafield(namespace: "hero", key: "cta") {
          value
        }
        spread: metafield(namespace: "hero", key: "spread") {
          reference {
            ...Media
          }
        }
        spreadSecondary: metafield(namespace: "hero", key: "spread_secondary") {
          reference {
            ...Media
          }
        }
      }
    }
    featuredCollections: collections(
      first: 3
      query: "collection_type:smart"
      sortKey: UPDATED_AT
    ) {
      nodes {
        id
        title
        handle
        image {
          altText
          width
          height
          url
        }
      }
    }
    featuredProducts: collection(handle:"featured") {
      products(first: 5) {
        nodes {
          ...ProductCard
        }
      }
    }
    homepageHero: shop {
      spread: metafield(namespace: "homepage", key: "main_hero") {
        reference {
          ... on MediaImage {
            mediaContentType
            alt
            image {
              url
              width
              height
            }
            previewImage {
              url
            }
            id
          }
        }
      }
      heading: metafield(namespace: "homepage", key: "main_hero_heading") {
        value
      }
      cta: metafield(namespace: "homepage", key: "main_hero_cta") {
        value
      }
      handle: metafield(namespace: "homepage", key: "main_hero_handle") {
        value
      }
    }
    secondaryHero: shop {
      spread: metafield(namespace: "homepage", key: "secondary_hero") {
        reference {
          ... on MediaImage {
            mediaContentType
            alt
            image {
              url
              width
              height
            }
            previewImage {
              url
            }
            id
          }
        }
      }
      heading: metafield(namespace: "homepage", key: "secondary_hero_heading") {
        value
      }
      cta: metafield(namespace: "homepage", key: "secondary_hero_cta") {
        value
      }
      handle: metafield(namespace: "homepage", key: "secondary_hero_handle") {
        value
      }
    }
  }
`;

const HOMEPAGE_SEO_QUERY = gql`
  query shopInfo {
    shop {
      name
      description
    }
  }
`;
