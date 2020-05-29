;; Auction.clar

;; This contract demo a simple auction
;; The fastest bidder with highest bid is the winner

;; Constants
(define-constant start-price 100)
(define-constant asset-owner 'SP1DQW1980HVS71XPSW91A8K2W2R3ZAJ75M5M0K5W)
(define-constant max-bid-count-exceeded (err 1))
(define-constant bid-too-low (err 2))
(define-constant auction-not-end (err 3))
(define-constant max-bid-count 5)

;; Storages
(define-map bids ((bidder principal)) ((price int)))
(define-data-var highest-bidder principal 'SP1DQW1980HVS71XPSW91A8K2W2R3ZAJ75M5M0K5W)
(define-data-var highest-bid int 100)
(define-data-var bid-count int 0)

;; Create a new bid
;; args:
;; @new-price (int) the new price
;; returns: (int) bid turn count if success or (err) if fail
(define-public (bid (new-price int))
  (if (< (var-get bid-count) max-bid-count)
    (if (> new-price start-price)
      (begin
        (var-set highest-bidder
          (if
            (> new-price (var-get highest-bid))
            tx-sender
            (var-get highest-bidder)
          )
        )

        (var-set highest-bid
          (if
            (> new-price (var-get highest-bid))
            new-price
            (var-get highest-bid)
          )
        )

        (map-set bids {bidder: tx-sender} {price: new-price})
        (var-set bid-count (+ (var-get bid-count) 1))
        (ok (var-get bid-count))
      )
      (err bid-too-low)
    )
    (err max-bid-count-exceeded)
  )
)

;; Get start price
;; args:
;; returns: (int) the start price
(define-public (get-start-price)
  (ok start-price)
)

;; Get highest bid
;; args:
;; returns: (int) the highest bid
(define-public (get-highest-bid)
  (ok (var-get highest-bid))
)

;; Get higest bidder
;; args:
;; returns: (principal) the highest bidder
(define-public (get-highest-bidder)
  (ok (var-get highest-bidder))
)

;; Get latest bid of
;; args:
;; @bidder: (principal) address of bidder
;; returns: (int) the latest bid of bidder
(define-public (get-latest-bid-of (bidder principal))
  (ok (default-to 0 (get price (map-get? bids {bidder: bidder}))))
)

;; Get winner: if max-bid-count
;; args:
;; returns: (principal) the latest bid of bidder
(define-public (get-winner)
  (if
    (>= (var-get bid-count) max-bid-count)
    (ok (var-get highest-bidder))
    auction-not-end
  )
)