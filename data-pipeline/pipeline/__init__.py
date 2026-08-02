"""Fletoret's book pipeline: BKD url in, published markdown out."""

# bibliotekadigjitale.bksh.al serves its leaf certificate without the Sectigo
# intermediate that signs it. macOS and browsers paper over this by fetching the
# missing certificate themselves; OpenSSL — and therefore Python — does not, and
# every request fails with CERTIFICATE_VERIFY_FAILED. `truststore` routes
# verification through the OS trust store, which does complete the chain.
#
# Best effort: if it isn't installed, requests still work anywhere the server is
# configured correctly, and the failure is a legible SSL error rather than a
# confusing import error at startup.
try:
    import truststore

    truststore.inject_into_ssl()
except ImportError:  # pragma: no cover
    pass
