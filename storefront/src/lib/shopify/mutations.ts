/**
 * Shopify Storefront API — Cart Mutations
 */

import { CART_FRAGMENT } from './queries'

export const CREATE_CART_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CreateCart($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartFragment }
      userErrors {
        field
        message
      }
    }
  }
`

export const ADD_TO_CART_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFragment }
      userErrors {
        field
        message
      }
    }
  }
`

export const UPDATE_CART_LINES_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFragment }
      userErrors {
        field
        message
      }
    }
  }
`

export const REMOVE_CART_LINES_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation RemoveCartLines($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFragment }
      userErrors {
        field
        message
      }
    }
  }
`

export const UPDATE_CART_DISCOUNT_CODES_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation UpdateCartDiscountCodes($cartId: ID!, $discountCodes: [String!]) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart { ...CartFragment }
      userErrors {
        field
        message
      }
    }
  }
`
