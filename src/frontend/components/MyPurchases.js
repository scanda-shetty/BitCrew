import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card } from 'react-bootstrap'

export default function MyPurchases({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true)
  const [purchases, setPurchases] = useState([])

  const loadPurchasedItems = async () => {
    try {
      // Fetch purchased items from marketplace by querying Bought events with the buyer set as the user
      const filter = marketplace.filters.Bought(null, null, null, null, null, account)
      const results = await marketplace.queryFilter(filter)

      // Fetch metadata of each NFT and add that to listedItem object.
      const purchases = await Promise.all(results.map(async i => {
        // Fetch arguments from each result
        i = i.args

        // Get URI from NFT contract
        const uri = await nft.tokenURI(i.tokenId)

        // Fetch the NFT metadata stored on IPFS
        const response = await fetch(uri)
        const metadata = await response.json()

        // Get total price of item (item price + fee)
        const totalPrice = await marketplace.getTotalPrice(i.itemId)

        // Define purchased item object
        let purchasedItem = {
          totalPrice,
          price: i.price,
          itemId: i.itemId,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image
        }
        return purchasedItem
      }))

      setPurchases(purchases)
    } catch (error) {
      console.error("Error loading purchased items:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPurchasedItems()
  }, [account, marketplace, nft])

  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )

  return (
    <div className="flex justify-center">
      {purchases.length > 0 ? (
        <div className="px-5 container">
          <Row xs={1} md={2} lg={4} className="g-4 py-5">
            {purchases.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Footer style={{ backgroundColor: "black" }}>
                    {ethers.utils.formatEther(item.totalPrice)} ETH
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ) : (
        <main style={{ padding: "1rem 0" }}>
          <h2>No purchases</h2>
        </main>
      )}
    </div>
  )
}
