def assert_dict_contains_subset(subset, dictionary):
    """
    Check whether dictionary is a superset of subset.

    If not, the assertion message will have useful details.
    """
    dictionary = dictionary
    missing_keys = sorted(list(set(subset.keys()) - set(dictionary.keys())))
    mismatch_vals = {
        k: (subset[k], dictionary[k])
        for k in subset
        if k in dictionary and subset[k] != dictionary[k]
    }
    assert missing_keys == [], f"Missing keys = {missing_keys}"
    assert mismatch_vals == {}, f"Mismatched values (s, d) = {mismatch_vals}"
